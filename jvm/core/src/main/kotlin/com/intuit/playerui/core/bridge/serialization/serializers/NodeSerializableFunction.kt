package com.intuit.playerui.core.bridge.serialization.serializers

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.DeserializationStrategy
import kotlin.reflect.KProperty

/** Delegate for automatic deserialization of [Node] values */
internal class NodeSerializableFunction<T : Invokable<R>, R> private constructor(
    private val provider: () -> Node,
    private val serializer: DeserializationStrategy<R>,
    internal val strategy: CacheStrategy,
    private val name: String?,
) {

    /** Caching strategy for determining how to pull the value from [Node] on subsequent attempts */
    public enum class CacheStrategy {
        None,
        Full,
    }

    /** Cache of container [Node] that will reset the [value] cache if out-of-date with the [provider] */
    private var cache: Node = provider(); get() {
        val provided = provider()
        field = provided
        value = null

        return field
    }

    /** Cache of the [T] value, along with the backing [Node] for objects */
    private var value: T? = null

    public operator fun getValue(thisRef: Any?, property: KProperty<*>): T {
        // early exit if we have a value and explicitly using the cache
        value?.takeIf { strategy == CacheStrategy.Full }?.let {
            return it
        }

        val key = name ?: property.name

        // will reset cache and value if mismatch
        val node = cache

        // else get and deserialize the value
        value = node
            .getInvokable(key, serializer) as T
        return value as T
    }

    public companion object {

        /** Smart constructor responsible for determining the correct [CacheStrategy] and [defaultValue] from the [serializer], if either are not provided */
        @ExperimentalPlayerApi
        public operator fun <T : Invokable<R>, R> invoke(
            provider: () -> Node,
            serializer: DeserializationStrategy<R>,
            strategy: CacheStrategy? = null,
            name: String? = null,
        ): NodeSerializableFunction<T, R> = NodeSerializableFunction(
            provider,
            serializer,
            strategy ?: CacheStrategy.Full,
            name,
        )
    }
}

@ExperimentalPlayerApi
internal fun <T : Invokable<R>, R> NodeWrapper.NodeSerializableFunction(
    serializer: DeserializationStrategy<R>,
    strategy: NodeSerializableFunction.CacheStrategy? = null,
    name: String? = null,
    defaultValue: (Node.(String) -> Invokable<R>)? = null,
): NodeSerializableFunction<T, R> = NodeSerializableFunction(::node, serializer, strategy, name)
