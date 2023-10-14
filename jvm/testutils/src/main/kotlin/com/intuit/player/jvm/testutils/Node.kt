package com.intuit.player.jvm.testutils

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.serialization.encoding.DecoderContext
import kotlinx.serialization.ContextualSerializer
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlin.reflect.jvm.reflect

/**
 * Testing [Node] structure backed directly by a [Map].
 * Note that this is technically an [Asset] but it may or may
 * not follow the requirements for being an asset. Thus, this
 * should strictly only be used for testing purposes.
 */
public class Node(private val map: Map<String, Any?>) : com.intuit.player.jvm.core.bridge.Node, Map<String, Any?> by map {

    override fun <R> getFunction(key: String): Invokable<R>? = get(key)?.let {
        when (it) {
            is Function<*> -> it
            else -> null
        }
    }?.let {
        Invokable { args ->
            it::reflect.call(*args) as R
        }
    }

    override fun <T> getSerializable(key: String, deserializer: DeserializationStrategy<T>, context: DecoderContext): T = get(key)?.let { value ->
        Json.decodeFromJsonElement(deserializer, Json.encodeToJsonElement(ContextualSerializer(Any::class).nullable, value))
    }!!

    override fun <T> deserialize(deserializer: DeserializationStrategy<T>, context: DecoderContext): T =
        Json.decodeFromJsonElement(
            deserializer,
            Json.encodeToJsonElement(MapSerializer(String.serializer(), ContextualSerializer(Any::class).nullable), map)
        )

    override fun isReleased(): Boolean = false

    override fun isUndefined(): Boolean = false

    override fun equals(other: Any?): Boolean = when (other) {
        is Node -> other.map == map
        is Map<*, *> -> other == this
        else -> false
    }

    override fun hashCode(): Int = map.hashCode()

    override fun nativeReferenceEquals(other: Any?): Boolean = when (other) {
        is Node -> other.map === map
        is Map<*, *> -> other === this
        else -> false
    }

    override val runtime: Runtime<*> get() = throw UnsupportedOperationException()
}
