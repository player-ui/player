package com.intuit.playerui.jsi

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.invokeVararg
import com.intuit.playerui.hermes.bridge.JSIValueWrapper
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.hermes.extensions.handleValue
import com.intuit.playerui.jsi.Function.Companion.createFromHostFunction
import com.intuit.playerui.jsi.serialization.format.JSIFormat
import com.intuit.playerui.jsi.serialization.format.decodeFromValue
import com.intuit.playerui.jsi.serialization.format.encodeToValue
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.JsonElement
import java.nio.ByteBuffer
import kotlin.reflect.KClass

public class PreparedJavaScript(@DoNotStrip private val mHybridData: HybridData)

// NOTE: mHybridData is required to be a member field, so we put it in the constructor
public open class Runtime(@DoNotStrip private val mHybridData: HybridData) {
    public external fun evaluateJavaScript(script: String, sourceURL: String = "unknown"): Value
    public external fun prepareJavaScript(script: String, sourceURL: String = "unknown"): PreparedJavaScript
    public external fun evaluatePreparedJavaScript(js: PreparedJavaScript): Value
    public external fun queueMicrotask(callback: Function)
    public external fun drainMicrotasks(maxMicrotasksHint: Int = -1): Boolean
    public external fun global(): Object
    public external fun description(): String

    protected val areEquals: Function by lazy {
        evaluateJavaScript("(a, b) => a == b").asObject(this).asFunction(this)
    }

    public fun areEquals(a: Value, b: Value): Boolean = areEquals.call(this, a, b).asBoolean()
}

// TODO: Do we just tie these to specific runtimes? I feel like that'd help w/ ergonomics and ensuring values are used with the same runtime context

// TODO: For serializing into JS objects, can we just make a HostObject?

/** Base interface for native JSI Value instance */
public sealed class JSIValueContainer(@DoNotStrip private val mHybridData: HybridData)

/** FBJNI wrapper for accessing facebook::jsi::Value APIs */
public class Value private constructor(mHybridData: HybridData) : JSIValueContainer(mHybridData) {

    public external fun isUndefined(): Boolean
    public external fun isNull(): Boolean
    public external fun isBoolean(): Boolean
    public external fun isNumber(): Boolean
    public external fun isString(): Boolean
    public external fun isBigInt(): Boolean // TODO: Consider isLong
    public external fun isSymbol(): Boolean
    public external fun isObject(): Boolean

    public external fun asBoolean(): Boolean
    public external fun asNumber(): Double
    public external fun asString(runtime: Runtime): String
    public external fun asBigInt(runtime: Runtime): Long
    public external fun asSymbol(runtime: Runtime): Symbol
    public external fun asObject(runtime: Runtime): Object
    public external fun toString(runtime: Runtime): String

    // TODO: I want to enable this, but requires runtime access
    //       Either, we store the runtime in the obj, or we make all runtime accesses explicit
//    public external override fun toString(): String

    // TODO: Add implementation that is pointer based?
//    override fun equals(other: Any?): Boolean {
//        return super.equals(other)
//    }

    public fun strictEquals(runtime: Runtime, other: Value): Boolean = strictEquals(runtime, this, other)

    // TODO: if the underlying hybridclass maintains a reference to the runtime, it'd be nice to expose that for the node impl

    public companion object {
        @JvmStatic public external fun from(value: Boolean): Value
        @JvmStatic public external fun from(value: Double): Value
        @JvmStatic public external fun from(value: Int): Value

        @JvmStatic public external fun from(runtime: Runtime, value: String): Value
        @JvmStatic public external fun from(runtime: Runtime, value: Long): Value

        @JvmStatic public external fun from(value: Symbol): Value
        @JvmStatic public external fun from(value: Object): Value

        // TODO: Settle on API
        public val undefined: Value @JvmStatic external get
        @JvmStatic public external fun undefined(): Value

        public val `null`: Value @JvmStatic external get
        @JvmStatic public external fun `null`(): Value

        @JvmStatic public external fun createFromJsonUtf8(
            runtime: Runtime,
            json: ByteBuffer,
        ): Value

        @JvmStatic public fun createFromJsonUtf8(
            runtime: Runtime,
            json: ByteArray,
        ): Value = createFromJsonUtf8(runtime, ByteBuffer.allocateDirect(json.size).apply { put(json) })

        @JvmStatic public fun createFromJsonUtf8(
            runtime: Runtime,
            json: String,
        ): Value = createFromJsonUtf8(runtime, json.toByteArray(Charsets.UTF_8))

        @JvmStatic public fun createFromJson(
            runtime: Runtime,
            json: JsonElement,
        ): Value = createFromJsonUtf8(runtime, json.toString())

        @JvmStatic public external fun strictEquals(runtime: Runtime, a: Value, b: Value): Boolean

        // TODO: It'd be nice to just serialize any into Value if we support that
        public fun from(runtime: Runtime, value: Any?): Value = when (value) {
            null -> `null`()
            Unit -> undefined()
            is NodeWrapper -> from(runtime, value.node)
            is JSIValueWrapper -> value.value
            is Boolean -> from(value)
            is Double -> from(value)
            is Int -> from(value)
            is String -> from(runtime, value)
            is Long -> from(runtime, value)
            is Symbol -> from(value)
            is Object -> from(value)
            is JsonElement -> createFromJson(runtime, value)
            // TODO: Move these to Function.from
            // TODO: Might need a UUID on the name if collisions are an issue
            // NOTE: Using JVM highest defined FunctionN (ignoring the actual FunctionN) param count here, but that could probably be increased if necessary
            is Invokable<*> -> createFromHostFunction(runtime, value::class.qualifiedName ?: "unknown", 22, HostFunction { _, _, args ->
                val encodedArgs = args.map { it.handleValue((runtime as HermesRuntime).format) }.toTypedArray()
                // TODO: Wrap in try/catch so we can help preserve error message
                from(runtime, value(*encodedArgs))
            }).asValue()
            is kotlin.Function<*> -> createFromHostFunction(runtime, value::class.qualifiedName ?: "unknown", 22, HostFunction { _, _, args ->
                val encodedArgs = args.map { it.handleValue((runtime as HermesRuntime).format) }

                // Hate that we need to look at an internal class for arity
                val arity = (value as kotlin.jvm.internal.FunctionBase<*>).arity

                // trim and pad args to fit arity constraints,
                // note that padding will fail if arg types are non-nullable
                val matchedArgs = (0 until arity)
                    .map { encodedArgs.getOrNull(it) }
                    .toTypedArray()

                // TODO: Serialization could go through runtime, or just a format func? (runtime as HermesRuntime).serialize()
                from(runtime, handleInvocation(value::class, matchedArgs) {
                    value.invokeVararg(*it)
                })
            }).asValue()
            else -> throw IllegalArgumentException("cannot automatically create Value from type ${value::class.qualifiedName}")
        }
    }
}

// TODO: Make common
private fun handleInvocation(reference: KClass<*>, args: kotlin.Array<Any?>, block: (kotlin.Array<Any?>) -> Any?) = try {
    block(args)
} catch (e: Throwable) {
    when (e) {
        is IllegalArgumentException, is ClassCastException ->
            // TODO: throw jsi encoding serialization exception
            throw SerializationException("arguments passed to $reference do not conform:\n${args.toList()}", e)
        else -> throw e
    }
}

// TODO: Could we make everything a JSIValueWrapper, so it's easy enough to do "asValue" dynamically?
public open class Object internal constructor(mHybridData: HybridData) : JSIValueContainer(mHybridData) {

    public external fun instanceOf(runtime: Runtime, ctor: Function): Boolean

    public external fun isArray(runtime: Runtime): Boolean
    public external fun isFunction(runtime: Runtime): Boolean
    public external fun asArray(runtime: Runtime): Array
    public external fun asFunction(runtime: Runtime): Function

    // TODO: Expand name to accept PropNameID for non-string based identifiers
    public external fun hasProperty(runtime: Runtime, name: String): Boolean
    public external fun setProperty(runtime: Runtime, name: String, value: Value)
    public external fun getPropertyNames(runtime: Runtime): Array
    public external fun getProperty(runtime: Runtime, name: String): Value
    public external fun getPropertyAsObject(runtime: Runtime, name: String): Object
    public external fun getPropertyAsFunction(runtime: Runtime, name: String): Function

    public fun asValue(): Value = Value.from(this)

    public companion object {
        @JvmStatic public external fun create(runtime: Runtime): Object
        @JvmStatic public external fun strictEquals(runtime: Runtime, a: Object, b: Object): Boolean
    }
}

// TODO: Decide on approach, companion invokes vs psuedo constructors
public fun Object(runtime: Runtime): Object = Object.create(runtime)

public class Array private constructor(mHybridData: HybridData) : Object(mHybridData) {
    public external fun size(runtime: Runtime): Int
    public external fun getValueAtIndex(runtime: Runtime, index: Int): Value
    public external fun setValueAtIndex(runtime: Runtime, index: Int, value: Value)

    public companion object {
        @JvmStatic public external fun createWithElements(runtime: Runtime, vararg elements: Value): Array
    }
}

// TODO: Enhanced HostFunction implementation that contains info about the method reference, so we can stop dealing in limitless lambda wrappers
public fun interface HostFunctionInterface {
    public fun call(runtime: Runtime, thisVal: Value, vararg args: Value): Value
}

public class HostFunction(private val func: HostFunctionInterface): HostFunctionInterface by func

public class Function private constructor(mHybridData: HybridData) : Object(mHybridData) {
    public external fun call(runtime: Runtime, vararg args: Value): Value
    public external fun callWithThis(runtime: Runtime, jsThis: Object, vararg value: Value): Value
    public external fun callAsConstructor(runtime: Runtime, vararg value: Value): Value
    public external fun isHostFunction(runtime: Runtime): Boolean

    public companion object {
        @JvmStatic public external fun createFromHostFunction(runtime: Runtime, name: String, paramCount: Int, func: HostFunction): Function
        public fun createFromHostFunction(runtime: Runtime, func: Value.(runtime: Runtime, args: kotlin.Array<out Value>) -> Value): Function =
            createFromHostFunction(runtime, "unknown", 22, HostFunction { runtime, thisVal, args -> thisVal.func(runtime, args) })
        public fun createFromHostFunction(runtime: Runtime, func: Value.(args: kotlin.Array<out Value>) -> Value): Function =
            createFromHostFunction(runtime, "unknown", 22, HostFunction { _, thisVal, args -> thisVal.func(args) })
        public fun createFromHostFunction(format: JSIFormat, func: (args: kotlin.Array<out Any?>) -> Any?): Function =
            createFromHostFunction(format.runtime, "unknown", 22, HostFunction { _, _, args ->
                format.encodeToValue(func(args.map { format.decodeFromValue<Any?>(it) }.toTypedArray()))
            })
    }
}

public class Symbol private constructor(mHybridData: HybridData) : JSIValueContainer(mHybridData) {
    public external fun toString(runtime: Runtime): String
    public fun asValue(): Value = Value.from(this)

    public companion object {
        @JvmStatic public external fun strictEquals(runtime: Runtime, a: Symbol, b: Symbol): Boolean
    }
}
