package com.intuit.player.jvm.core.player.state

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.flow.state.NavigationFlowState
import kotlinx.serialization.Serializable

@Serializable(NamedState.Serializer::class)
public class NamedState internal constructor(override val node: Node) : NodeWrapper {
    /** The name of the navigation node */
    public val name: String
        get() = node.getString("name") ?: ""

    /** The navigation node */
    public val value: NavigationFlowState
        get() = node.getSerializable("value", NavigationFlowState.serializer())!!

    override fun toString(): String = (name to value).toString()

    internal object Serializer : NodeWrapperSerializer<NamedState>(::NamedState)
}
