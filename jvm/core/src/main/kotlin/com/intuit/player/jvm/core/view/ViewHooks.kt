package com.intuit.player.jvm.core.view

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncHook1
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.resolver.Resolver
import kotlinx.serialization.Serializable

@Serializable(with = ViewHooks.Serializer::class)
public class ViewHooks internal constructor(override val node: Node) : NodeWrapper {
    public val onUpdate: NodeSyncHook1<Asset> by NodeSerializableField(NodeSyncHook1.serializer(Asset.serializer()))
    public val resolver: NodeSyncHook1<Resolver> by NodeSerializableField(NodeSyncHook1.serializer(Resolver.serializer()))

    internal object Serializer : NodeWrapperSerializer<ViewHooks>(::ViewHooks)
}
