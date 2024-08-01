package com.intuit.playerui.core.view

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.resolver.ResolveOptions
import com.intuit.playerui.core.view.View.Serializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.nullable

/** Limited definition of a stateful view instance from a flow */
@Serializable(with = Serializer::class)
public class View internal constructor(override val node: Node) : NodeWrapper {
    public val hooks: ViewHooks by NodeSerializableField(ViewHooks.serializer())

    public val lastUpdate: Asset? by NodeSerializableField(Asset.serializer().nullable)

    public val resolverOptions: ResolveOptions by NodeSerializableField(ResolveOptions.serializer())

    internal object Serializer : NodeWrapperSerializer<View>(::View)
}
