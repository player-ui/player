package com.intuit.playerui.hermes.bridge

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.format.RuntimeFormat
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.jsi.Array
import com.intuit.playerui.jsi.Function
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Value
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.builtins.ArraySerializer

abstract class HermesRuntimeFormat(override val runtime: HermesRuntime) : RuntimeFormat<Value>

public class HermesNode(private val jsiObject: Object, override val runtime: HermesRuntime) : Node {

    override val format: HermesRuntimeFormat get() = TODO("format")

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
    override fun <T> deserialize(deserializer: DeserializationStrategy<T>): T = format.decodeFromRuntimeValue(deserializer, jsiObject)

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
        is Object -> Object.strictEquals(runtime, jsiObject, other) // TODO: This probably shouldn't be strict equals
        is HermesNode -> equals(other.jsiObject)
        is NodeWrapper -> equals(other.node)
        is Map<*, *> -> keys == other.keys && keys.all { get(it) == other[it] }
        else -> false
    }

    // TODO: Need to go implement this so the object layer defines the hashcode from the native ref ptr
    override fun hashCode(): Int = jsiObject.hashCode()

    override fun toString(): String = keys.associateWith(::get).toString()
}

private fun Any?.handleValue(format: HermesRuntimeFormat): Any? = when (this) {
    is Value -> transform(format)
    else -> this
}

private fun Value.transform(format: HermesRuntimeFormat): Any? = when {
    isUndefined() -> null
    isNull() -> null
    isBoolean() -> asBoolean()
    isNumber() -> asNumber()
    isString() -> asString(format.runtime)
    isBigInt() -> asBigInt(format.runtime)
    isSymbol() -> asSymbol(format.runtime).toString(format.runtime) // TODO: This is what we do w/ symbols?
    isObject() -> asObject(format.runtime).transform(format)
    else -> null
}

private fun Object.transform(format: HermesRuntimeFormat): Any = when {
    isArray(format.runtime) -> asArray(format.runtime).toList(format)
    isFunction(format.runtime) -> asFunction(format.runtime).toInvokable<Any?>(format, format.serializer())
    else ->  toNode(format)
}

// Object can be an Array or Function here, prefer using transform, unless you specifically need a Node
private fun Object.toNode(format: HermesRuntimeFormat): Node = HermesNode(this, format.runtime).let {
    // Auto wrapping as asset if it meets the criteria - it's still a node, but a special one
    if (it.containsKey("id") && it.containsKey("value")) Asset(it) else it
}

private fun Array.toList(format: HermesRuntimeFormat): List<Any?> = (0..size(format.runtime))
    .map { i -> getValueAtIndex(format.runtime, i) }
    .map { it.transform(format) }

private fun <R> Function.toInvokable(format: HermesRuntimeFormat, deserializationStrategy: DeserializationStrategy<R>?): Invokable<R> = Invokable { args ->
    try {
        // TODO: Instead of handling the value, and then deserializing, could we just deserialize since we know the result will be a Value?
        val result = call(format.runtime, format.encodeToRuntimeValue(
            ArraySerializer(GenericSerializer()),
            args as kotlin.Array<Any?>, // TODO: Anything we can do about this cast?
        )).handleValue(format)

        if (result is Node && deserializationStrategy != null) {
            result.deserialize(deserializationStrategy)
        } else result as R
    } catch (e: Throwable) {
        e.printStackTrace()
        throw e
    }
}
