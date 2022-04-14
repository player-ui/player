package com.intuit.player.jvm.core.view

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncHook1
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField.Companion.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable

/** Limited definition of the player view controller responsible for managing updating/switching views */
@Serializable(with = ViewController.Serializer::class)
public class ViewController internal constructor(override val node: Node) : NodeWrapper {
    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    /** Current view of the flow, if any */
    public val currentView: View? get() =
        node.getSerializable("currentView", View.serializer())

    @Serializable(with = Hooks.Serializer::class)
    public class Hooks internal constructor(override val node: Node) : NodeWrapper {
        /** The hook right before the View starts resolving. Attach anything custom here */
        public val view: NodeSyncHook1<View>
            get() = NodeSyncHook1(node.getObject("view")!!, View.serializer())

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    internal object Serializer : NodeWrapperSerializer<ViewController>(::ViewController)
}
