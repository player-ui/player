package com.intuit.player.jvm.core.view

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncHook1
import com.intuit.player.jvm.core.resolver.Resolver

public class ViewHooks internal constructor(override val node: Node) : NodeWrapper {
    public val onUpdate: NodeSyncHook1<Asset>
        get() = NodeSyncHook1(node.getObject("onUpdate")!!, Asset.serializer())
    public val resolver: NodeSyncHook1<Resolver>
        get() = NodeSyncHook1(node.getObject("resolver")!!, Resolver.serializer())
}
