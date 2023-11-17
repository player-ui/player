package com.intuit.player.jvm.core.view

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.nullable

/** Limited definition of a stateful view instance from a flow */
@Serializable(with = View.Serializer::class)
public class View internal constructor(override val node: Node) : NodeWrapper {
    public val hooks: ViewHooks by NodeSerializableField(ViewHooks.serializer())

    public val lastUpdate: Asset? by NodeSerializableField(Asset.serializer().nullable)

    internal object Serializer : NodeWrapperSerializer<View>(::View)
}
