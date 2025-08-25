package com.intuit.playerui.core.resolver

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeSyncWaterfallHook2
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.resolver.Resolver.Serializer
import kotlinx.serialization.Serializable

@Serializable(with = Serializer::class)
public class Resolver(
    override val node: Node,
) : NodeWrapper {
    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    @Serializable(with = Hooks.Serializer::class)
    public class Hooks internal constructor(
        override val node: Node,
    ) : NodeWrapper {
        public val resolveOptions: NodeSyncWaterfallHook2<ResolveOptions, Node>
            by NodeSerializableField(NodeSyncWaterfallHook2.serializer(ResolveOptions.serializer(), Node.serializer()))

        internal object Serializer : NodeWrapperSerializer<Hooks>(Resolver::Hooks)
    }

    internal object Serializer : NodeWrapperSerializer<Resolver>(::Resolver)
}
