package com.intuit.playerui.jsi

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.invokeVararg
import com.intuit.playerui.hermes.bridge.JSIValueWrapper
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.hermes.extensions.RuntimeThreadContext
import com.intuit.playerui.hermes.extensions.UnsafeRuntimeThreadAPI
import com.intuit.playerui.hermes.extensions.evaluateInCurrentThread
import com.intuit.playerui.hermes.extensions.handleValue
import com.intuit.playerui.jsi.Function.Companion.createFromHostFunction
import com.intuit.playerui.jsi.serialization.format.JSIEncodingException
import com.intuit.playerui.jsi.serialization.format.JSIFormat
import com.intuit.playerui.jsi.serialization.format.decodeFromValue
import com.intuit.playerui.jsi.serialization.format.encodeToValue
import kotlinx.serialization.json.JsonElement
import java.nio.ByteBuffer
import kotlin.reflect.KClass

public abstract class HybridClass internal constructor(
    @DoNotStrip protected val mHybridData: HybridData,
) {
    public fun isReleased(): Boolean = synchronized(mHybridData) {
        !mHybridData.isValid
    }

    public open fun release() {
        mHybridData.resetNative()
    }
}

public class PreparedJavaScript(
    mHybridData: HybridData,
) : HybridClass(mHybridData)

// NOTE: mHybridData is required to be a member field, so we put it in the constructor
public open class Runtime(
    mHybridData: HybridData,
) : HybridClass(mHybridData) {
    context(RuntimeThreadContext)
    public external fun evaluateJavaScript(script: String, sourceURL: String = "unknown"): Value

    context(RuntimeThreadContext)
    public external fun prepareJavaScript(script: String, sourceURL: String = "unknown"): PreparedJavaScript

    context(RuntimeThreadContext)
    public external fun evaluatePreparedJavaScript(js: PreparedJavaScript): Value

    context(RuntimeThreadContext)
    public external fun queueMicrotask(callback: Function)

    context(RuntimeThreadContext)
    public external fun drainMicrotasks(maxMicrotasksHint: Int = -1): Boolean

    context(RuntimeThreadContext)
    public external fun global(): Object

    context(RuntimeThreadContext)
    public external fun description(): String

    context(RuntimeThreadContext)
    protected val jsEquals: Function by lazy {
        @OptIn(UnsafeRuntimeThreadAPI::class)
        evaluateInCurrentThread {
            evaluateJavaScript("(a, b) => a == b").asObject(this@Runtime).asFunction(this@Runtime)
        }
    }

    context(RuntimeThreadContext)
    public fun jsEquals(a: Value, b: Value): Boolean = jsEquals.call(this, a, b).asBoolean()

    context(RuntimeThreadContext)
    public fun stringify(value: Value): String = global()
        .getPropertyAsObject(this, "JSON")
        .getPropertyAsFunction(this, "stringify")
        .call(this, value, Value.`null`, Value.from(this, 2))
        .asString(this)
}

/** Base interface for native JSI Value instance */
public sealed class JSIValueContainer(
    mHybridData: HybridData,
) : HybridClass(mHybridData) {
    context(RuntimeThreadContext)
    public abstract fun asValue(runtime: Runtime): Value
}

/** FBJNI wrapper for accessing facebook::jsi::Value APIs */
public class Value private constructor(
    mHybridData: HybridData,
) : JSIValueContainer(mHybridData) {
    public external fun isUndefined(): Boolean

    public external fun isNull(): Boolean

    public external fun isBoolean(): Boolean

    public external fun isNumber(): Boolean

    public external fun isString(): Boolean

    public external fun isBigInt(): Boolean

    public external fun isSymbol(): Boolean

    public external fun isObject(): Boolean

    public external fun asBoolean(): Boolean

    // TODO: Consider making this return Number directly, so there aren't assumptions about what will come out of this
    public external fun asNumber(): Double

    context(RuntimeThreadContext)
    public external fun asString(runtime: Runtime): String

    context(RuntimeThreadContext)
    public external fun asBigInt(runtime: Runtime): Long

    context(RuntimeThreadContext)
    public external fun asSymbol(runtime: Runtime): Symbol

    context(RuntimeThreadContext)
    public external fun asObject(runtime: Runtime): Object

    context(RuntimeThreadContext)
    public external fun toString(runtime: Runtime): String

    context(RuntimeThreadContext)
    public fun strictEquals(runtime: Runtime, other: Value): Boolean = strictEquals(runtime, this, other)

    context(RuntimeThreadContext)
    override fun asValue(runtime: Runtime): Value = this

    public companion object {
        @JvmStatic public external fun from(value: Boolean): Value

        @JvmStatic public external fun from(value: Double): Value

        @JvmStatic public external fun from(value: Int): Value

        context(RuntimeThreadContext)
        @JvmStatic public external fun from(runtime: Runtime, value: String): Value

        context(RuntimeThreadContext)
        @JvmStatic public external fun from(runtime: Runtime, value: Long): Value

        context(RuntimeThreadContext)
        @JvmStatic public external fun from(runtime: Runtime, value: Symbol): Value

        context(RuntimeThreadContext)
        @JvmStatic public external fun from(runtime: Runtime, value: Object): Value

        public val undefined: Value @JvmStatic external get

        public val `null`: Value @JvmStatic external get

        context(RuntimeThreadContext)
        @JvmStatic public external fun createFromJsonUtf8(runtime: Runtime, json: ByteBuffer): Value

        context(RuntimeThreadContext)
        @JvmStatic public fun createFromJsonUtf8(runtime: Runtime, json: ByteArray): Value =
            createFromJsonUtf8(runtime, ByteBuffer.allocateDirect(json.size).apply { put(json) })

        context(RuntimeThreadContext)
        @JvmStatic public fun createFromJsonUtf8(runtime: Runtime, json: String): Value = createFromJsonUtf8(
            runtime,
            json.toByteArray(Charsets.UTF_8),
        )

        context(RuntimeThreadContext)
        @JvmStatic public fun createFromJson(runtime: Runtime, json: JsonElement): Value = createFromJsonUtf8(runtime, json.toString())

        context(RuntimeThreadContext)
        @JvmStatic public external fun strictEquals(
            runtime: Runtime,
            a: Value,
            b: Value,
        ): Boolean

        context(RuntimeThreadContext)
        public fun from(runtime: Runtime, value: Any?): Value = when (value) {
            null -> `null`
            Unit -> undefined
            is NodeWrapper -> from(runtime, value.node)
            is JSIValueWrapper -> value.value
            is Boolean -> from(value)
            is Double -> from(value)
            is Int -> from(value)
            is String -> from(runtime, value)
            is Long -> from(runtime, value)
            is Symbol -> from(runtime, value)
            is Object -> from(runtime, value)
            is JsonElement -> createFromJson(runtime, value)
            is Invokable<*> -> createFromHostFunction(
                runtime,
                value::class.qualifiedName ?: "unknown",
                22, // NOTE: using max constrained jvm arity
                HostFunction { _, _, args ->
                    val encodedArgs =
                        args.map { it.handleValue((runtime as HermesRuntime).format) }.toTypedArray()
                    from(runtime, value(*encodedArgs))
                },
            ).asValue(runtime)
            is kotlin.Function<*> -> createFromHostFunction(
                runtime,
                value::class.qualifiedName ?: "unknown",
                22,
                HostFunction { _, _, args ->
                    val encodedArgs = args.map { it.handleValue((runtime as HermesRuntime).format) }

                    // Hate that we need to look at an internal class for arity
                    val arity = (value as kotlin.jvm.internal.FunctionBase<*>).arity

                    // trim and pad args to fit arity constraints,
                    // note that padding will fail if arg types are non-nullable
                    val matchedArgs = (0 until arity)
                        .map { encodedArgs.getOrNull(it) }
                        .toTypedArray()

                    from(
                        runtime,
                        handleInvocation(value::class, matchedArgs) {
                            value.invokeVararg(*it)
                        },
                    )
                },
            ).asValue(runtime)
            else -> (runtime as? HermesRuntime)
                .let {
                    it ?: throw IllegalArgumentException("cannot automatically create Value from type ${value::class.qualifiedName}")
                }.format
                .encodeToValue(value)
        }
    }
}

// TODO: Make common
private fun handleInvocation(
    reference: KClass<*>,
    args: kotlin.Array<Any?>,
    block: (kotlin.Array<Any?>) -> Any?,
) = try {
    block(args)
} catch (e: Throwable) {
    when (e) {
        is IllegalArgumentException, is ClassCastException ->
            throw JSIEncodingException("arguments passed to $reference do not conform:\n${args.toList()}", e)
        else -> throw e
    }
}

public open class Object internal constructor(
    mHybridData: HybridData,
) : JSIValueContainer(mHybridData) {
    context(RuntimeThreadContext)
    public external fun instanceOf(runtime: Runtime, ctor: Function): Boolean

    context(RuntimeThreadContext)
    public external fun isArray(runtime: Runtime): Boolean

    context(RuntimeThreadContext)
    public external fun isFunction(runtime: Runtime): Boolean

    context(RuntimeThreadContext)
    public external fun asArray(runtime: Runtime): Array

    context(RuntimeThreadContext)
    public external fun asFunction(runtime: Runtime): Function

    // TODO: Expand name to accept PropNameID for non-string based identifiers
    context(RuntimeThreadContext)
    public external fun hasProperty(runtime: Runtime, name: String): Boolean

    context(RuntimeThreadContext)
    public external fun setProperty(
        runtime: Runtime,
        name: String,
        value: Value,
    )

    context(RuntimeThreadContext)
    public external fun getPropertyNames(runtime: Runtime): Array

    context(RuntimeThreadContext)
    public external fun getProperty(runtime: Runtime, name: String): Value

    context(RuntimeThreadContext)
    public external fun getPropertyAsObject(runtime: Runtime, name: String): Object

    context(RuntimeThreadContext)
    public external fun getPropertyAsFunction(runtime: Runtime, name: String): Function

    context(RuntimeThreadContext)
    public override fun asValue(runtime: Runtime): Value = Value.from(runtime, this)

    context(RuntimeThreadContext)
    public fun setProperty(
        runtime: Runtime,
        name: String,
        value: JSIValueContainer,
    ): Unit = setProperty(runtime, name, value.asValue(runtime))

    public companion object {
        context(RuntimeThreadContext)
        @JvmStatic public external fun create(runtime: Runtime): Object

        context(RuntimeThreadContext)
        @JvmStatic public external fun strictEquals(
            runtime: Runtime,
            a: Object,
            b: Object,
        ): Boolean
    }
}

context(RuntimeThreadContext)
public fun Object(runtime: Runtime): Object = Object.create(runtime)

public class Array private constructor(
    mHybridData: HybridData,
) : Object(mHybridData) {
    context(RuntimeThreadContext)
    public external fun size(runtime: Runtime): Int

    context(RuntimeThreadContext)
    public external fun getValueAtIndex(runtime: Runtime, index: Int): Value

    context(RuntimeThreadContext)
    public external fun setValueAtIndex(
        runtime: Runtime,
        index: Int,
        value: Value,
    )

    public companion object {
        context(RuntimeThreadContext)
        @JvmStatic public external fun createWithElements(runtime: Runtime, vararg elements: Value): Array
    }
}

// TODO: Enhance HostFunction implementation that contains info about the method reference, so we can stop dealing in limitless lambda wrappers
public fun interface HostFunctionInterface {
    public fun call(
        runtime: Runtime,
        thisVal: Value,
        vararg args: Value,
    ): Value
}

public class HostFunction(
    private val func: HostFunctionInterface,
) : HostFunctionInterface by func

public class Function private constructor(
    mHybridData: HybridData,
) : Object(mHybridData) {
    context(RuntimeThreadContext)
    public external fun call(runtime: Runtime, vararg args: Value): Value

    context(RuntimeThreadContext)
    public external fun callWithThis(
        runtime: Runtime,
        jsThis: Object,
        vararg value: Value,
    ): Value

    context(RuntimeThreadContext)
    public external fun callAsConstructor(runtime: Runtime, vararg value: Value): Value

    context(RuntimeThreadContext)
    public external fun isHostFunction(runtime: Runtime): Boolean

    context(RuntimeThreadContext)
    public fun callWithThis(
        runtime: Runtime,
        jsThis: Value,
        vararg value: Value,
    ): Value = if (jsThis.isObject()) {
        callWithThis(runtime, jsThis.asObject(runtime), *value)
    } else {
        call(runtime, *value)
    }

    public companion object {
        context(RuntimeThreadContext)
        @JvmStatic public external fun createFromHostFunction(
            runtime: Runtime,
            name: String,
            paramCount: Int,
            func: HostFunction,
        ): Function

        // TODO: Use paramCount to validate args against?
        context(RuntimeThreadContext)
        public fun createFromHostFunction(
            runtime: Runtime,
            name: String = "unknown",
            paramCount: Int = 22,
            func: Value.(runtime: Runtime, args: kotlin.Array<out Value>) -> Value,
        ): Function = createFromHostFunction(runtime, name, paramCount, HostFunction { _, thisVal, args -> thisVal.func(runtime, args) })

        context(RuntimeThreadContext)
        public fun createFromHostFunction(
            runtime: Runtime,
            name: String = "unknown",
            paramCount: Int = 22,
            func: Value.(args: kotlin.Array<out Value>) -> Value,
        ): Function = createFromHostFunction(runtime, name, paramCount, HostFunction { _, thisVal, args -> thisVal.func(args) })

        context(RuntimeThreadContext)
        public fun createFromHostFunction(format: JSIFormat, func: (args: kotlin.Array<out Any?>) -> Any?): Function =
            createFromHostFunction(
                format.runtime,
                "unknown",
                22,
                HostFunction { _, _, args ->
                    format.encodeToValue(func(args.map { format.decodeFromValue<Any?>(it) }.toTypedArray()))
                },
            )
    }
}

public class Symbol private constructor(
    mHybridData: HybridData,
) : JSIValueContainer(mHybridData) {
    context(RuntimeThreadContext)
    public external fun toString(runtime: Runtime): String

    context(RuntimeThreadContext)
    public override fun asValue(runtime: Runtime): Value = Value.from(runtime, this)

    public companion object {
        context(RuntimeThreadContext)
        @JvmStatic public external fun strictEquals(
            runtime: Runtime,
            a: Symbol,
            b: Symbol,
        ): Boolean
    }
}
