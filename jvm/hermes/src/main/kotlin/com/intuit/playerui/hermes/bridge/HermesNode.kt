package com.intuit.playerui.hermes.bridge

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.hermes.extensions.handleValue
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

    override val value: Value by lazy { jsiObject.asValue() }

    override val format: JSIFormat get() = runtime.format

    override val keys: Set<String> by lazy {
        val names = jsiObject.getPropertyNames(runtime)
        val size = names.size(runtime)

        // TODO: This could probably be handled via handleValue
        (0..size).map { i -> names.getValueAtIndex(runtime, i) }
            .filterNot(Value::isUndefined)
            // NOTE: since we don't have proper propname support, we just toString it - this may not be suitable for all use cases
            .map { it.toString(runtime) }
            .toSet()
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

    private fun getJSIValue(key: String): Value = jsiObject.getProperty(runtime, key)

    private fun getJSIObject(key: String): Object? = getJSIValue(key)
        .takeIf(Value::isObject)
        ?.asObject(runtime)

    private fun getJSIArray(key: String): Array? = getJSIObject(key)
        ?.takeIf { it.isArray(runtime) }
        ?.asArray(runtime)

    private fun getJSIFunction(key: String): Function? = getJSIObject(key)
        ?.takeIf { it.isFunction(runtime) }
        ?.asFunction(runtime)

    override fun get(key: String): Any? = jsiObject.getProperty(runtime, key)
        .handleValue(format)

    override fun <R> getInvokable(key: String, deserializationStrategy: DeserializationStrategy<R>): Invokable<R>? = getJSIFunction(key)
        ?.toInvokable(format, deserializationStrategy)

    override fun <R> getFunction(key: String): Invokable<R>? = getJSIFunction(key)
        ?.toInvokable(format, null)

    override fun getList(key: String): List<*>? = getJSIArray(key)
        ?.toList(format)

    override fun getObject(key: String): Node? = getJSIObject(key)
        // TODO: This doesn't account for functions or arrays, leaving as-is allows
        //       consumers to be able to leverage the Node API for arbitrary object types
        ?.toNode(format)

    override fun <T> getSerializable(key: String, deserializer: DeserializationStrategy<T>): T? {
        return getJSIValue(key).let {
            // TODO: We could probably handle this within the decoder
//            .mapUndefinedToNull()?.let {
            format.decodeFromRuntimeValue(deserializer, it)
        }
    }

    // TODO: Figure out how to support both Object and Value (and others), as they don't share a common ancestor
    override fun <T> deserialize(deserializer: DeserializationStrategy<T>): T = format.decodeFromRuntimeValue(deserializer, jsiObject.asValue())

    // TODO: Incorporate release strategy
    override fun isReleased(): Boolean = false

    // JSI Object can't be undefined, Value can be
    override fun isUndefined(): Boolean = false

    override fun nativeReferenceEquals(other: Any?): Boolean = when (other) {
        is Object -> Object.strictEquals(runtime, jsiObject, other)
        // TODO: Or just ValueWrapper
        is HermesNode -> nativeReferenceEquals(other.jsiObject)
        is NodeWrapper -> nativeReferenceEquals(other.node)
        else -> false
    }

    // compare object equality first, then dive deeper to expand until we can just compare values
    override fun equals(other: Any?): Boolean = when (other) {
        // TODO: Does this invalidate the jsiObject reference?
        is Object -> runtime.areEquals(jsiObject.asValue(), other.asValue())
        is HermesNode -> equals(other.jsiObject)
        is NodeWrapper -> equals(other.node)
        is Map<*, *> -> keys == other.keys && keys.all { get(it) == other[it] }
        else -> false
    }

    // TODO: Need to go implement this so the object layer defines the hashcode from the native ref ptr
    override fun hashCode(): Int = jsiObject.hashCode()

    override fun toString(): String = keys.associateWith(::get).toString()
}
