package com.intuit.playerui.core.flow

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.MapBackedNode
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull

/** Structure shaping the JSON payload the player expects */
@Serializable(with = Flow.Serializer::class)
public class Flow private constructor(override val node: Node) : NodeWrapper {
    @OptIn(ExperimentalPlayerApi::class)
    public val id: String by NodeSerializableField(String.serializer()) { UNKNOWN_ID }

    @OptIn(ExperimentalPlayerApi::class)
    public val views: List<Asset>? by NodeSerializableField(ListSerializer(Asset.serializer()).nullable) { emptyList() }

    @OptIn(ExperimentalPlayerApi::class)
    public val schema: JsonElement by NodeSerializableField(JsonElement.serializer()) { JsonNull }

    @OptIn(ExperimentalPlayerApi::class)
    public val data: JsonElement by NodeSerializableField(JsonElement.serializer()) { JsonNull }

    @OptIn(ExperimentalPlayerApi::class)
    public val navigation: Navigation? by NodeSerializableField(Navigation.serializer().nullable) { null }

    internal object Serializer : NodeWrapperSerializer<Flow>(::Flow)

    public companion object {
        public const val UNKNOWN_ID: String = "unknown-id"
        public operator fun invoke(
            id: String = UNKNOWN_ID,
            views: List<Asset>? = emptyList(),
            schema: JsonElement = JsonNull,
            data: JsonElement = JsonNull,
            navigation: Navigation? = null,
        ): Flow {
            val paramsMap: Map<String, Any?> = mapOf(
                "id" to id,
                "views" to views,
                "schema" to schema,
                "data" to data,
                "navigation" to navigation,
            )
            return Flow(MapBackedNode(paramsMap))
        }
    }
}
