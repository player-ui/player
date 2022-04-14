package com.intuit.player.jvm.core.view

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable

/** Limited definition of a stateful view instance from a flow */
@Serializable(with = View.Serializer::class)
public class View internal constructor(override val node: Node) : NodeWrapper {
    public val hooks: ViewHooks get() = ViewHooks(node.getObject("hooks")!!)

    public val lastUpdate: Asset? get() = node.getObject("lastUpdate") as? Asset

    internal object Serializer : NodeWrapperSerializer<View>(::View)
}
