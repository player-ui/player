package com.intuit.player.jvm.core.bridge

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeFormat
import com.intuit.player.jvm.core.bridge.serialization.format.serializer
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull

/**
 * Read-only map-like structure to enable reading from a native
 * data source without needing to understand the underlying
 * interface.
 */
public interface Node : Map<String, Any?> {

    // Typed APIs
    /**
     * Returns the value corresponding to the given [key] as a [String],
     * or `null` if such a key is not present in the node or if the value is not a [String]
     */
    public fun getString(key: String): String? = get(key).safeCast()

    /**
     * Returns the value corresponding to the given [key] as a [Int],
     * or `null` if such a key is not present in the node or if the value is not a [Int]
     */
    public fun getInt(key: String): Int? = get(key).safeCast()

    /**
     * Returns the value corresponding to the given [key] as a [Double],
     * or `null` if such a key is not present in the node or if the value is not a [Double]
     */
    public fun getDouble(key: String): Double? = get(key).safeCast()

    /**
     * Returns the value corresponding to the given [key] as a [Long],
     * or `null` if such a key is not present in the node or if the value is not a [Long]
     */
    public fun getLong(key: String): Long? = get(key).safeCast()

    /**
     * Returns the value corresponding to the given [key] as a [Boolean],
     * or `null` if such a key is not present in the node or if the value is not a [Boolean]
     */
    public fun getBoolean(key: String): Boolean? = get(key).safeCast()

    /**
     * Returns the value corresponding to the given [key] as a [Invokable],
     * or `null` if such a key is not present in the node or if the value is not invokable
     */
    public fun <R> getFunction(key: String): Invokable<R>? = get(key).safeCast()

    /**
     * Returns the value corresponding to the given [key] as a [List],
     * or `null` if such a key is not present in the node or if the value is not a [List]
     */
    public fun getList(key: String): List<*>? = get(key).safeCast()

    /**
     * Returns the value corresponding to the given [key] as a [Node],
     * or `null` if such a key is not present in the node or if the value is not a [Node]
     */
    public fun getObject(key: String): Node? = get(key).safeCast<Node>()?.let {
        if (it.containsKey("id") and it.containsKey("type")) Asset(it) else it
    }

    /**
     * Deserializes the value corresponding to the given [key] into [T] using the the [deserializer]
     * or `null` if such a key is not present in the node or if the value is not a [Node]
     */
    public fun <T> getSerializable(key: String, deserializer: DeserializationStrategy<T>): T?

    /** Deserializes the backing value corresponding to the current [Node] into [T] using the [deserializer] */
    public fun <T> deserialize(deserializer: DeserializationStrategy<T>): T

    /**
     * Returns whether the backing object has been released in the context of the runtime
     */
    public fun isReleased(): Boolean

    /**
     * Returns whether the backing object is undefined
     */
    public fun isUndefined(): Boolean

    /** Returns true if the backing object is referentially equal */
    public fun nativeReferenceEquals(other: Any?): Boolean

    public val runtime: Runtime<*>

    public val format: RuntimeFormat<*> get() = runtime.format
}

public val NodeWrapper.runtime: Runtime<*> get() = node.runtime

public val NodeWrapper.format: RuntimeFormat<*> get() = node.format

/** Returns the value corresponding to the given [key] as a [JsonElement] */
public fun Node.getJson(key: String): JsonElement = getSerializable(key, JsonElement.serializer()) ?: JsonNull

/** Returns the value corresponding to the current [Node] as a [JsonElement] */
public fun Node.toJson(): JsonElement = deserialize(JsonElement.serializer())

public inline fun <reified T> Node.deserialize(): T = deserialize(format.serializer())

public inline fun <reified T> Node.deserialize(deserializer: DeserializationStrategy<T>?): T = deserializer?.let {
    deserialize(it)
} ?: deserialize()

public inline fun <reified T> Node.getSerializable(key: String): T? = getSerializable(key, format.serializer())

public inline fun <reified T> Node.getSerializable(key: String, serializer: DeserializationStrategy<T>?): T? = serializer?.let {
    getSerializable(key, it)
} ?: getSerializable(key)

private inline fun <reified T> Any?.safeCast(): T? = this as? T

internal object EmptyNode : Node {
    override fun <T> getSerializable(key: String, deserializer: DeserializationStrategy<T>): T? = null
    override fun <T> deserialize(deserializer: DeserializationStrategy<T>): T = throw UnsupportedOperationException()
    override val entries: Set<Map.Entry<String, Any?>> = emptySet()
    override val keys: Set<String> = emptySet()
    override val size: Int = 0
    override val values: Collection<Any?> = emptySet()
    override fun containsKey(key: String): Boolean = false
    override fun containsValue(value: Any?): Boolean = false
    override fun get(key: String): Any? = null
    override fun isEmpty(): Boolean = true
    override fun isReleased(): Boolean = false
    override fun isUndefined(): Boolean = false
    override fun nativeReferenceEquals(other: Any?): Boolean = other is EmptyNode
    override val runtime: Runtime<*> get() = throw UnsupportedOperationException()
}
