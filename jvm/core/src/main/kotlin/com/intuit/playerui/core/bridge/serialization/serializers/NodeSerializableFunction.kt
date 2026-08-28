package com.intuit.playerui.core.bridge.serialization.serializers

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.format.RuntimeSerializationException
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.DeserializationStrategy
import kotlin.reflect.KProperty

/** Delegate for automatic deserialization of [Node] values */
public class NodeSerializableFunction<R> private constructor(
    private val nodeProvider: () -> Node,
    private val serializerProvider: () -> DeserializationStrategy<R>,
    internal val strategy: CacheStrategy,
    private val name: String?,
) {
    /** Caching strategy for determining how to pull the value from [Node] on subsequent attempts */
    public enum class CacheStrategy {
        None,
        Full,
    }

    /** Cache of container [Node] that resets the [value] cache when out-of-date with the [nodeProvider] */
    private val cache: Node
        get() {
            val provided = nodeProvider()
            serializer = serializerProvider()
            value = null
            return provided
        }

    private lateinit var serializer: DeserializationStrategy<R>

    /** Cache of the [T] value, along with the backing [Node] for objects */
    private var value: Invokable<R>? = null

    public operator fun getValue(thisRef: Any?, property: KProperty<*>): Invokable<R> {
        // early exit if we have a value and explicitly using the cache
        value?.takeIf { strategy == CacheStrategy.Full }?.let {
            return it
        }

        val key = name ?: property.name

        // will reset cache and value
        val node = cache
        val function = node.getInvokable(key, serializer)
            ?: throw RuntimeSerializationException("No function named '$key' on $this")

        return function.also { value = it }
    }

    public companion object {
        /** Smart constructor responsible for determining the correct [CacheStrategy] and [defaultValue] from the [serializer], if either are not provided */
        @ExperimentalPlayerApi
        public operator fun <R> invoke(
            nodeProvider: () -> Node,
            serializerProvider: () -> DeserializationStrategy<R>,
            strategy: CacheStrategy? = null,
            name: String? = null,
        ): NodeSerializableFunction<R> = NodeSerializableFunction(
            nodeProvider,
            serializerProvider,
            strategy ?: CacheStrategy.Full,
            name,
        )

        /** Smart constructor responsible for determining the correct [CacheStrategy] and [defaultValue] from the [serializer], if either are not provided */
        @ExperimentalPlayerApi
        public operator fun <R> invoke(
            nodeProvider: () -> Node,
            serializer: DeserializationStrategy<R>,
            strategy: CacheStrategy? = null,
            name: String? = null,
        ): NodeSerializableFunction<R> = NodeSerializableFunction(
            nodeProvider,
            { serializer },
            strategy ?: CacheStrategy.Full,
            name,
        )
    }
}

/**
 * Delegate a member function of this [NodeWrapper]'s node, deserializing its
 * return value with the given [serializer].
 */
@ExperimentalPlayerApi
public fun <R> NodeWrapper.NodeSerializableFunction(
    serializer: DeserializationStrategy<R>,
    strategy: NodeSerializableFunction.CacheStrategy? = null,
    name: String? = null,
    defaultValue: (Node.(String) -> Invokable<R>)? = null,
): NodeSerializableFunction<R> = NodeSerializableFunction(::node, { serializer }, strategy, name)

/**
 * Delegate a member function of this [NodeWrapper]'s node, deserializing its
 * return value with the given [serializer].
 */
@ExperimentalPlayerApi
public fun <R> NodeWrapper.NodeSerializableFunction(
    serializerProvider: () -> DeserializationStrategy<R>,
    strategy: NodeSerializableFunction.CacheStrategy? = null,
    name: String? = null,
    defaultValue: (Node.(String) -> Invokable<R>)? = null,
): NodeSerializableFunction<R> = NodeSerializableFunction(::node, serializerProvider, strategy, name)

/** Reified convenience that infers the return-type serializer from [R] */
@ExperimentalPlayerApi
public inline fun <reified R> NodeWrapper.NodeSerializableFunction(
    strategy: NodeSerializableFunction.CacheStrategy? = null,
    name: String? = null,
    noinline defaultValue: (Node.(String) -> Invokable<R>)? = null,
): NodeSerializableFunction<R> = NodeSerializableFunction({ node.format.serializer<R>() }, strategy, name, defaultValue)
