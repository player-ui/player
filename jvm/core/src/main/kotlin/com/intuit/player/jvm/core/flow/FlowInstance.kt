package com.intuit.player.jvm.core.flow

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncHook1
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncHook2
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncWaterfallHook1
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncWaterfallHook2
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField.Companion.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.flow.state.NavigationFlowState
import com.intuit.player.jvm.core.player.state.NamedState
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer

@Serializable(FlowInstance.Serializer::class)
public class FlowInstance(override val node: Node) : NodeWrapper, Transition {

    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    public val currentState: NamedState? get() = node.getSerializable("currentState", NamedState.serializer())

    override fun transition(state: String, options: TransitionOptions?) {
        node.getFunction<Unit>("transition")?.invoke(state, options)
    }

    @Serializable(Hooks.Serializer::class)
    public class Hooks internal constructor(override val node: Node) : NodeWrapper {
        /** A callback when the onStart node was present */
        public val onStart: NodeSyncHook1<Any?> get() = NodeSyncHook1(
            node.getObject("onStart")!!,
            GenericSerializer()
        )

        /** A callback when the onEnd node was present */
        public val onEnd: NodeSyncHook1<Any?> get() = NodeSyncHook1(
            node.getObject("onEnd")!!,
            GenericSerializer()
        )

        /** A chance to manipulate the flow-node used to calculate the given transition used  */
        public val beforeTransition: NodeSyncWaterfallHook2<NavigationFlowState, String> get() = NodeSyncWaterfallHook2(
            node.getObject("beforeTransition")!!,
            NavigationFlowState.serializer(),
            String.serializer(),
        )

        /** A chance to manipulate the flow-node calculated after a transition */
        public val resolveTransitionNode: NodeSyncWaterfallHook1<NavigationFlowState> get() = NodeSyncWaterfallHook1(
            node.getObject("resolveTransitionNode")!!,
            NavigationFlowState.serializer(),
        )

        /** A callback when a transition from 1 state to another was made */
        public val transition: NodeSyncHook2<NamedState?, NamedState> get() = NodeSyncHook2(
            node.getObject("transition")!!,
            NamedState.serializer().nullable,
            NamedState.serializer()
        )

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    internal object Serializer : NodeWrapperSerializer<FlowInstance>(::FlowInstance)
}
