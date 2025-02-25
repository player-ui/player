package com.intuit.playerui.core.flow

import com.intuit.playerui.core.bridge.EmptyNode
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getSerializable
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
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull

/** Structure shaping the JSON payload the player expects */
@Serializable(with = Flow.Serializer::class)
public class Flow(override val node: Node) : NodeWrapper {

    private var mFlow: MutableMap<String, Any?>? = null

    private constructor(
        id: String = UNKNOWN_ID,
        views: List<Node>? = emptyList(),
        schema: Node? = null,
        data: Node? = null,
        navigation: Navigation? = null
    ) : this(EmptyNode) {
        this.mFlow = mutableMapOf<String, Any?>().also {
            it["id"] = id
            it["views"] = views
            it["schema"] = schema
            it["data"] = data
            it["navigation"] = navigation
        }
    }

    public val id: String
        get() = mFlow?.let {
            it["id"] as String
        } ?: node.getString("id") ?: UNKNOWN_ID

    public val views: List<Node>?
        get() = mFlow?.let {
            it["views"] as? List<Node>
        } ?: node.getList("views") as? List<Node>

    public val schema: Node?
        get() = mFlow?.let {
            it["schema"] as? Node
        } ?: node.getObject("schema")

    public val data: Node?
        get() = mFlow?.let {
            it["data"] as? Node
        } ?: node.getObject("data")

    public val navigation: Navigation?
        get() = mFlow?.let {
            it["navigation"] as? Navigation
        } ?: node.getSerializable("navigation")

    internal object Serializer : NodeWrapperSerializer<Flow>(::Flow)

    public companion object {
        public const val UNKNOWN_ID: String = "unknown-id"
        public fun createFlow(
            id: String = UNKNOWN_ID,
            views: List<Node>? = emptyList(),
            schema: Node? = null,
            data: Node? = null,
            navigation: Navigation? = null
        ): Flow {
            return Flow(id, views, schema, data, navigation)
        }
    }
}