package com.intuit.player.jvm.core.resolver

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncWaterfallHook2
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable

@Serializable(with = Resolver.Serializer::class)
public class Resolver(override val node: Node) : NodeWrapper {

    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    @Serializable(with = Hooks.Serializer::class)
    public class Hooks internal constructor(override val node: Node) : NodeWrapper {
        public val resolveOptions: NodeSyncWaterfallHook2<ResolveOptions, Node>
            by NodeSerializableField(NodeSyncWaterfallHook2.serializer(ResolveOptions.serializer(), Node.serializer()))

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    internal object Serializer : NodeWrapperSerializer<Resolver>(::Resolver)
}
