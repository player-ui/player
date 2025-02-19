package com.intuit.playerui.core.flow

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook1
import com.intuit.playerui.core.bridge.serialization.serializers.*
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer

/** Limited definition of the player flow controller that enables flow transitions */
@Serializable(with = FlowController.Serializer::class)
public class FlowController internal constructor(override val node: Node) : NodeWrapper, Transition {
    private val transition: Invokable<Unit>? by NodeSerializableFunction()

    override fun transition(state: String, options: TransitionOptions?) {
        transition?.invoke(state, options)
    }

    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    public val current: FlowInstance? by NodeSerializableField(FlowInstance.serializer().nullable)

    @Serializable(Hooks.Serializer::class)
    public class Hooks internal constructor(override val node: Node) : NodeWrapper {

        public val flow: NodeSyncHook1<FlowInstance>
            by NodeSerializableField(NodeSyncHook1.serializer(FlowInstance.serializer()))

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    internal object Serializer : NodeWrapperSerializer<FlowController>(::FlowController)
}
