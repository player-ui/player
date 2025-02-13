package com.intuit.playerui.core.flow

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull

/** Structure shaping the JSON payload the player expects */
@Serializable(with = Flow.Serializer::class)
public class Flow private constructor(override val node: Node) : NodeWrapper {
    @OptIn(ExperimentalPlayerApi::class)
    public val id: String by NodeSerializableField(String.serializer())

    @OptIn(ExperimentalPlayerApi::class)
    public val views: List<JsonElement>? by NodeSerializableField(ListSerializer(JsonElement.serializer()).nullable)

    @OptIn(ExperimentalPlayerApi::class)
    public val schema: JsonElement by NodeSerializableField(JsonElement.serializer())

    @OptIn(ExperimentalPlayerApi::class)
    public val data: JsonElement by NodeSerializableField(JsonElement.serializer())

    @OptIn(ExperimentalPlayerApi::class)
    public val navigation: Navigation? by NodeSerializableField(Navigation.serializer().nullable)

    internal object Serializer : NodeWrapperSerializer<Flow>(::Flow)

    public companion object {
        public const val UNKNOWN_ID: String = "unknown-id"
        public operator fun invoke(
            id: String = UNKNOWN_ID,
            views: List<JsonElement>? = emptyList(),
            schema: JsonElement = JsonNull,
            data: JsonElement = JsonNull,
            navigation: Navigation? = null
        ) : Flow {
            val paramsMap: Map<String, Any?> = mapOf(
                "id" to id,
                "views" to views,
                "schema" to schema,
                "data" to data,
                "navigation" to navigation
            )
            return Flow(object : Node {
                override fun <T> getSerializable(key: String, deserializer: DeserializationStrategy<T>): T = throw UnsupportedOperationException()
                override fun <T> deserialize(deserializer: DeserializationStrategy<T>): T = throw UnsupportedOperationException()
                override val entries: Set<Map.Entry<String, Any?>> = paramsMap.entries
                override val keys: Set<String> = paramsMap.keys
                override val size: Int = paramsMap.size
                override val values: Collection<Any?> = paramsMap.values
                override fun containsKey(key: String): Boolean = paramsMap.containsKey(key)
                override fun containsValue(value: Any?): Boolean = paramsMap.containsValue(value)
                override fun get(key: String): Any? = paramsMap[key]
                override fun isEmpty(): Boolean = paramsMap.isEmpty()
                override fun isReleased(): Boolean = false
                override fun isUndefined(): Boolean = false
                override fun nativeReferenceEquals(other: Any?): Boolean = other is Node && this.entries == other.entries
                override val runtime: Runtime<*> get() = throw UnsupportedOperationException()
            })
        }
    }
}