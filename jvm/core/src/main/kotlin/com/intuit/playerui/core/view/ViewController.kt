package com.intuit.playerui.core.view

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook1
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.view.ViewController.Serializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.nullable

/** Limited definition of the player view controller responsible for managing updating/switching views */
@Serializable(with = Serializer::class)
public class ViewController internal constructor(
    override val node: Node,
) : NodeWrapper {
    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    /** Current view of the flow, if any */
    public val currentView: View? by NodeSerializableField(View.serializer().nullable)

    @Serializable(with = Hooks.Serializer::class)
    public class Hooks internal constructor(
        override val node: Node,
    ) : NodeWrapper {
        /** The hook right before the View starts resolving. Attach anything custom here */
        public val view: NodeSyncHook1<View> by NodeSerializableField(NodeSyncHook1.serializer(View.serializer()))

        internal object Serializer : NodeWrapperSerializer<Hooks>(ViewController::Hooks)
    }

    internal object Serializer : NodeWrapperSerializer<ViewController>(::ViewController)
}
