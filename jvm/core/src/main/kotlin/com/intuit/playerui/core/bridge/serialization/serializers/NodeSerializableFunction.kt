package com.intuit.playerui.core.bridge.serialization.serializers

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.DeserializationStrategy
import kotlin.reflect.KProperty

/** Delegate for automatic deserialization of [Node] values */
public class NodeSerializableFunction<R> private constructor(
    private val provider: () -> Node,
    private val serializerProvider: () -> DeserializationStrategy<R>,
    internal val strategy: CacheStrategy,
    private val name: String?,
) {
    /** Memoized result of [serializerProvider] resolved on first access. */
    private val serializer: DeserializationStrategy<R> by lazy(serializerProvider)

    /** Caching strategy for determining how to pull the value from [Node] on subsequent attempts */
    public enum class CacheStrategy {
        None,
        Full,
    }

    /**
     * Cache of container [Node] that resets the [value] cache when out-of-date
     * with the [provider]. Lazily initialized on first [getValue] call so the
     * delegate can be declared before the underlying node is available
     * (e.g. when [NodeWrapper.node] is backed by a `lateinit` field).
     */
    private var cache: Node? = null

    /** Cache of the [T] value, along with the backing [Node] for objects */
    private var value: Invokable<R>? = null

    public operator fun getValue(thisRef: Any?, property: KProperty<*>): Invokable<R> {
        val currentNode = provider()
        if (cache !== currentNode) {
            cache = currentNode
            value = null
        }

        // early exit if we have a value and explicitly using the cache
        value?.takeIf { strategy == CacheStrategy.Full }?.let {
            return it
        }

        val key = name ?: property.name
        val resolved = currentNode.getInvokable(key, serializer)!!
        value = resolved
        return resolved
    }

    public companion object {
        /**
         * Smart constructor accepting an eager [serializer]. The [provider] is
         * always lazy. The serializer is wrapped in a `lazy { }` so it is
         * captured eagerly when supplied this way but never re-evaluated.
         */
        @ExperimentalPlayerApi
        public operator fun <R> invoke(
            provider: () -> Node,
            serializer: DeserializationStrategy<R>,
            strategy: CacheStrategy? = null,
            name: String? = null,
        ): NodeSerializableFunction<R> = NodeSerializableFunction(
            provider,
            { serializer },
            strategy ?: CacheStrategy.Full,
            name,
        )

        /**
         * Smart constructor accepting a lazy [serializerProvider]. Use this
         * when the serializer can only be resolved after the underlying [Node]
         * is initialized (e.g. when resolving via `node.format.serializer()`).
         */
        @ExperimentalPlayerApi
        public operator fun <R> invoke(
            provider: () -> Node,
            serializerProvider: () -> DeserializationStrategy<R>,
            strategy: CacheStrategy? = null,
            name: String? = null,
        ): NodeSerializableFunction<R> = NodeSerializableFunction(
            provider,
            serializerProvider,
            strategy ?: CacheStrategy.Full,
            name,
        )
    }
}

@ExperimentalPlayerApi
public fun <R> NodeWrapper.NodeSerializableFunction(
    serializer: DeserializationStrategy<R>,
    strategy: NodeSerializableFunction.CacheStrategy? = null,
    name: String? = null,
    defaultValue: (Node.(String) -> Invokable<R>)? = null,
): NodeSerializableFunction<R> = NodeSerializableFunction(::node, serializer, strategy, name)

@ExperimentalPlayerApi
public inline fun <reified R> NodeWrapper.NodeSerializableFunction(
    strategy: NodeSerializableFunction.CacheStrategy? = null,
    name: String? = null,
    noinline defaultValue: (Node.(String) -> Invokable<R>)? = null,
): NodeSerializableFunction<R> = NodeSerializableFunction(::node, { node.format.serializer<R>() }, strategy, name)
