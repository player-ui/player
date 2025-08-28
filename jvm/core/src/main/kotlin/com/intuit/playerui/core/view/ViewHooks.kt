package com.intuit.playerui.core.view

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook1
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.resolver.Resolver
import com.intuit.playerui.core.view.ViewHooks.Serializer
import kotlinx.serialization.Serializable

@Serializable(with = Serializer::class)
public class ViewHooks internal constructor(
    override val node: Node,
) : NodeWrapper {
    public val onUpdate: NodeSyncHook1<Asset> by NodeSerializableField(NodeSyncHook1.serializer(Asset.serializer()))
    public val resolver: NodeSyncHook1<Resolver> by NodeSerializableField(NodeSyncHook1.serializer(Resolver.serializer()))

    internal object Serializer : NodeWrapperSerializer<ViewHooks>(::ViewHooks)
}
