package com.intuit.playerui.core.player.state

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.flow.state.NavigationFlowState
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.serializer

@Serializable(NamedState.Serializer::class)
public class NamedState internal constructor(
    override val node: Node,
) : NodeWrapper {
    /** The name of the navigation node */
    public val name: String by NodeSerializableField(String.serializer())

    /** The navigation node */
    public val value: NavigationFlowState by NodeSerializableField(NavigationFlowState.serializer())

    override fun toString(): String = (name to value).toString()

    internal object Serializer : NodeWrapperSerializer<NamedState>(::NamedState)
}
