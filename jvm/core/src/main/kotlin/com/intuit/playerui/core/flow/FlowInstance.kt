package com.intuit.playerui.core.flow

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeSyncBailHook1
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook1
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook2
import com.intuit.playerui.core.bridge.hooks.NodeSyncWaterfallHook1
import com.intuit.playerui.core.bridge.hooks.NodeSyncWaterfallHook2
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.flow.state.NavigationFlowState
import com.intuit.playerui.core.player.state.NamedState
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer

@Serializable(FlowInstance.Serializer::class)
public class FlowInstance(override val node: Node) : NodeWrapper, Transition {

    public val id: String by NodeSerializableField(String.serializer())

    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    public val currentState: NamedState? by NodeSerializableField(NamedState.serializer().nullable)

    private val transition: Invokable<Unit>? by NodeSerializableFunction()

    override fun transition(state: String, options: TransitionOptions?) {
        transition?.invoke(state, options)
    }

    @Serializable(Hooks.Serializer::class)
    public class Hooks internal constructor(override val node: Node) : NodeWrapper {
        /** A callback when the onStart node was present */
        public val onStart: NodeSyncHook1<Any?> by NodeSerializableField(NodeSyncHook1.serializer(GenericSerializer()))

        /** A callback when the onEnd node was present */
        public val onEnd: NodeSyncHook1<Any?> by NodeSerializableField(NodeSyncHook1.serializer(GenericSerializer()))

        /** A chance to manipulate the flow-node used to calculate the given transition used  */
        public val beforeTransition: NodeSyncWaterfallHook2<NavigationFlowState, String>
            by NodeSerializableField(NodeSyncWaterfallHook2.serializer(NavigationFlowState.serializer(), String.serializer()))

        /** A hook to intercept and block a transition */
        public val skipTransition: NodeSyncBailHook1<NamedState, Boolean>
            by NodeSerializableField(NodeSyncBailHook1.serializer(NamedState.serializer(), Boolean.serializer()))

        /** A chance to manipulate the flow-node calculated after a transition */
        public val resolveTransitionNode: NodeSyncWaterfallHook1<NavigationFlowState>
            by NodeSerializableField(NodeSyncWaterfallHook1.serializer(NavigationFlowState.serializer()))

        /** A callback when a transition from 1 state to another was made */
        public val transition: NodeSyncHook2<NamedState?, NamedState>
            by NodeSerializableField(NodeSyncHook2.serializer(NamedState.serializer().nullable, NamedState.serializer()))

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    internal object Serializer : NodeWrapperSerializer<FlowInstance>(::FlowInstance)
}
