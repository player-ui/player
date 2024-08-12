package com.intuit.playerui.core.bridge.serialization.serializers

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.PlayerException
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PolymorphicKind
import kotlinx.serialization.descriptors.StructureKind
import kotlinx.serialization.serializer
import kotlin.reflect.KProperty

/** Delegate for automatic deserialization of [Node] values */
public class NodeSerializableField<T> private constructor(
    private val provider: () -> Node,
    private val serializer: KSerializer<T>,
    internal val strategy: CacheStrategy,
    private val name: String?,
    private val defaultValue: Node.(String) -> T,
) {

    /** Caching strategy for determining how to pull the value from [Node] on subsequent attempts */
    public enum class CacheStrategy {
        None,
        Smart,
        Full,
    }

    /** Cache of container [Node] that will reset the [value] cache if out-of-date with the [provider] */
    private var cache: Node = provider(); get() {
        val provided = provider()
        if (provided.nativeReferenceEquals(field)) {
            field
        } else {
            field = provided
            value = null
        }

        return field
    }

    /** Cache of the [T] value, along with the backing [Node] for objects */
    private var value: Pair<Node?, T>? = null

    public operator fun getValue(thisRef: Any?, property: KProperty<*>): T {
        // early exit if we have a value and explicitly using the cache
        value?.takeIf { strategy == CacheStrategy.Full }?.let { (_, value) ->
            return value
        }

        val key = name ?: property.name

        // will reset cache and value if mismatch
        val node = cache

        // early exit if we have a value still and referentially match the backing [Node]
        value?.takeIf { strategy == CacheStrategy.Smart }
            ?.takeIf { (backing) -> backing?.nativeReferenceEquals(node[key]) == true }
            ?.let { (_, value) -> return value }

        // else get and deserialize the value
        return node
            .getSerializable(key, serializer)
            ?.also { value = node.getObject(key) to it }
            ?: node.defaultValue(key)
    }

    public companion object {

        /** Smart constructor responsible for determining the correct [CacheStrategy] and [defaultValue] from the [serializer], if either are not provided */
        @ExperimentalPlayerApi
        public operator fun <T> invoke(
            provider: () -> Node,
            serializer: KSerializer<T>,
            strategy: CacheStrategy? = null,
            name: String? = null,
            defaultValue: (Node.(String) -> T)? = null,
        ): NodeSerializableField<T> = NodeSerializableField(
            provider,
            serializer,
            strategy ?: when (serializer.descriptor.kind) {
                is StructureKind,
                is PolymorphicKind,
                -> CacheStrategy.Smart
                else -> CacheStrategy.None
            },
            name,
            defaultValue ?: {
                @Suppress("UNCHECKED_CAST")
                if (serializer.descriptor.isNullable) {
                    null as T
                } else {
                    throw throw PlayerException("""Could not deserialize "$it" as "${serializer.descriptor}"""")
                }
            },
        )

        /** Smart constructor to automatically determine the [KSerializer] to use for [T] */
        @ExperimentalPlayerApi
        public inline operator fun <reified T> invoke(
            noinline provider: () -> Node,
            strategy: CacheStrategy? = null,
            name: String? = null,
            noinline defaultValue: (Node.(String) -> T)? = null,
        ): NodeSerializableField<T> = NodeSerializableField(provider, serializer<T>(), strategy, name, defaultValue)
    }
}

@ExperimentalPlayerApi
public fun <T> NodeWrapper.NodeSerializableField(
    serializer: KSerializer<T>,
    strategy: NodeSerializableField.CacheStrategy? = null,
    name: String? = null,
    defaultValue: (Node.(String) -> T)? = null,
): NodeSerializableField<T> = NodeSerializableField(::node, serializer, strategy, name, defaultValue)

//@ExperimentalPlayerApi
//public inline fun <reified T : Any> NodeWrapper.NodeSerializableField(
//    serializer: KSerializer<T>? = null,
//    strategy: NodeSerializableField.CacheStrategy? = null,
//    name: String? = null,
//    noinline defaultValue: (Node.(String) -> T)? = null,
//): NodeSerializableField<T> {
//    val effectiveSerializer = serializer ?: node.format.serializer<T>()
//    return NodeSerializableField(::node, effectiveSerializer, strategy, name, defaultValue)
//}

@ExperimentalPlayerApi
public inline fun <reified T> NodeWrapper.NodeSerializableField(
    strategy: NodeSerializableField.CacheStrategy? = null,
    name: String? = null,
    noinline defaultValue: (Node.(String) -> T)? = null,
): NodeSerializableField<T> = NodeSerializableField(node.format.serializer<T>(), strategy, name, defaultValue)
