package com.intuit.player.jvm.core.flow

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.getJson
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.flow.state.NavigationFlowEndState
import com.intuit.player.jvm.core.flow.state.NavigationFlowState
import com.intuit.player.jvm.core.player.PlayerException
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull

@Serializable(with = FlowResult.Serializer::class)
public class FlowResult(override val node: Node) : NodeWrapper {

    /** End state describing _how_ the flow ended (forwards, backwards, etc) */
    public val endState: NavigationFlowEndState
        get() = node.getSerializable("endState", NavigationFlowState.serializer())
            as? NavigationFlowEndState ?: throw PlayerException("flow result not defined")

    /** The serialized data-model */
    public val data: JsonElement get() = node.getJson("data") ?: JsonNull

    override fun equals(other: Any?): Boolean = node == other

    override fun hashCode(): Int = node.hashCode()

    public object Serializer : NodeWrapperSerializer<FlowResult>(::FlowResult)
}
