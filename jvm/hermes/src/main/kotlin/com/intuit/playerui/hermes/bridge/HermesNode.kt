package com.intuit.playerui.hermes.bridge

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.hermes.extensions.RuntimeThreadContext
import com.intuit.playerui.hermes.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.hermes.extensions.handleValue
import com.intuit.playerui.hermes.extensions.mapUndefinedToNull
import com.intuit.playerui.hermes.extensions.toInvokable
import com.intuit.playerui.hermes.extensions.toList
import com.intuit.playerui.hermes.extensions.toNode
import com.intuit.playerui.jsi.Array
import com.intuit.playerui.jsi.Function
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.format.JSIFormat
import kotlinx.serialization.DeserializationStrategy

public interface JSIValueWrapper {
    public val value: Value
}

public class HermesNode(private val jsiObject: Object, override val runtime: HermesRuntime) : Node, JSIValueWrapper {

    override val value: Value by lazy {
        runtime.evaluateInJSThreadBlocking {
            jsiObject.asValue(runtime)
        }
    }

    override val format: JSIFormat get() = runtime.format

    override val keys: Set<String> by lazy {
        runtime.evaluateInJSThreadBlocking {
            val names = jsiObject.getPropertyNames(runtime)
            val size = names.size(runtime)

            // TODO: This could probably be handled via handleValue
            (0 until size).map { i -> names.getValueAtIndex(runtime, i) }
                .filterNot(Value::isUndefined)
                // NOTE: since we don't have proper propname support, we just toString it - this may not be suitable for all use cases
                .map { it.toString(runtime) }
                .toSet()
        }
    }

    // TODO: The next six could be default impls
    override val size: Int by lazy {
        keys.size
    }

    override val entries: Set<Map.Entry<String, Any?>> by lazy {
        keys.associateWith(::get).entries
    }

    override val values: List<Any?> by lazy {
        keys.map(::get)
    }

    override fun containsKey(key: String): Boolean = keys.contains(key)

    override fun containsValue(value: Any?): Boolean = values.contains(value)

    override fun isEmpty(): Boolean = size == 0

    // TODO: Should we make this getNonNullishJSIValue() to push mapUndefinedToNull up?
    context(RuntimeThreadContext) private fun getJSIValue(key: String): Value = jsiObject.getProperty(runtime, key)

    context(RuntimeThreadContext) private fun getJSIObject(key: String): Object? = getJSIValue(key)
        .takeIf(Value::isObject)
        ?.asObject(runtime)

    context(RuntimeThreadContext) private fun getJSIArray(key: String): Array? = getJSIObject(key)
        ?.takeIf { it.isArray(runtime) }
        ?.asArray(runtime)

    context(RuntimeThreadContext) private fun getJSIFunction(key: String): Function? = getJSIObject(key)
        ?.takeIf { it.isFunction(runtime) }
        ?.asFunction(runtime)

    override operator fun get(key: String): Any? = runtime.evaluateInJSThreadBlocking {
        jsiObject.getProperty(runtime, key).handleValue(format)
    }

    override fun <R> getInvokable(key: String, deserializationStrategy: DeserializationStrategy<R>): Invokable<R>? = runtime.evaluateInJSThreadBlocking {
        getJSIFunction(key)
    }?.toInvokable(format, jsiObject, deserializationStrategy)

    override fun <R> getFunction(key: String): Invokable<R>? = runtime.evaluateInJSThreadBlocking {
        getJSIFunction(key)
    }?.toInvokable(format, jsiObject, null)

    override fun getList(key: String): List<*>? = runtime.evaluateInJSThreadBlocking {
        getJSIArray(key)?.toList(format)
    }

    override fun getObject(key: String): Node? = runtime.evaluateInJSThreadBlocking {
        getJSIObject(key)
    }?.toNode(format)

    override fun <T> getSerializable(key: String, deserializer: DeserializationStrategy<T>): T? = runtime.evaluateInJSThreadBlocking {
        getJSIValue(key)
    }.mapUndefinedToNull()?.let { format.decodeFromRuntimeValue(deserializer, it) }

    override fun <T> deserialize(deserializer: DeserializationStrategy<T>): T = runtime.evaluateInJSThreadBlocking {
        jsiObject.asValue(runtime)
    }.let { format.decodeFromRuntimeValue(deserializer, it) }

    // TODO: Incorporate release strategy
    override fun isReleased(): Boolean = false

    // JSI Object can't be undefined, Value can be
    override fun isUndefined(): Boolean = false

    override fun nativeReferenceEquals(other: Any?): Boolean = when (other) {
        is Object -> runtime.evaluateInJSThreadBlocking {
            Object.strictEquals(runtime, jsiObject, other)
        }
        // TODO: Or just ValueWrapper
        is HermesNode -> nativeReferenceEquals(other.jsiObject)
        is NodeWrapper -> nativeReferenceEquals(other.node)
        else -> false
    }

    override fun equals(other: Any?): Boolean = when (other) {
        is Map<*, *> -> keys == other.keys && keys.all {
            get(it) == other[it]
        }
        is NodeWrapper -> equals(other.node)
        is Object -> equals(HermesNode(other, runtime))
        else -> false
    }

    // TODO: Need to go implement this so the object layer defines the hashcode from the native ref ptr or PropNameId
    override fun hashCode(): Int = jsiObject.hashCode()

    override fun toString(): String = keys.associateWith(::get).toString()
}
