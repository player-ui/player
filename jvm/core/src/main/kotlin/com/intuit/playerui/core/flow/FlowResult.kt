package com.intuit.playerui.core.flow

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.flow.state.NavigationFlowEndState
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull

@Serializable(with = FlowResult.Serializer::class)
public class FlowResult(override val node: Node) : NodeWrapper {

    /** End state describing _how_ the flow ended (forwards, backwards, etc) */
    public val endState: NavigationFlowEndState by NodeSerializableField(NavigationFlowEndState.serializer())

    /** The serialized data-model */
    public val data: JsonElement by NodeSerializableField(JsonElement.serializer()) { JsonNull }

    override fun equals(other: Any?): Boolean = node == other

    override fun hashCode(): Int = node.hashCode()

    public object Serializer : NodeWrapperSerializer<FlowResult>(::FlowResult)
}
