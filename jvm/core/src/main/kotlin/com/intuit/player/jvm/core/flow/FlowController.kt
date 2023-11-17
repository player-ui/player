package com.intuit.player.jvm.core.flow

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncHook1
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField.Companion.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable

/** Limited definition of the player flow controller that enables flow transitions */
@Serializable(with = FlowController.Serializer::class)
public class FlowController internal constructor(override val node: Node) : NodeWrapper, Transition {
    override fun transition(state: String, options: TransitionOptions?) {
        node.getInvokable<Unit>("transition")?.invoke(state, options)
    }

    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    public val current: FlowInstance? get() = node.getSerializable("current", FlowInstance.serializer())

    @Serializable(Hooks.Serializer::class)
    public class Hooks internal constructor(override val node: Node) : NodeWrapper {
        public val flow: NodeSyncHook1<FlowInstance>
            get() = NodeSyncHook1(node.getObject("flow")!!, FlowInstance.serializer())

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    internal object Serializer : NodeWrapperSerializer<FlowController>(::FlowController)
}
