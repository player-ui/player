package com.intuit.playerui.testutils

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlin.reflect.jvm.reflect

/**
 * Testing [Node] structure backed directly by a [Map].
 * Note that this is technically an [Asset] but it may or may
 * not follow the requirements for being an asset. Thus, this
 * should strictly only be used for testing purposes.
 */
public class Node(private val map: Map<String, Any?>) : com.intuit.playerui.core.bridge.Node, Map<String, Any?> by map {

    override fun <R> getInvokable(key: String, deserializationStrategy: DeserializationStrategy<R>): Invokable<R>? = get(key)?.let {
        when (it) {
            is Function<*> -> it
            else -> null
        }
    }?.let {
        Invokable { args ->
            it::reflect.call(*args) as R
        }
    }

    override fun <T> getSerializable(key: String, deserializer: DeserializationStrategy<T>): T = get(key)?.let { value ->
        Json.decodeFromJsonElement(deserializer, Json.encodeToJsonElement(GenericSerializer(), value))
    }!!

    override fun <T> deserialize(deserializer: DeserializationStrategy<T>): T =
        Json.decodeFromJsonElement(
            deserializer,
            Json.encodeToJsonElement(MapSerializer(String.serializer(), GenericSerializer()), map),
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
