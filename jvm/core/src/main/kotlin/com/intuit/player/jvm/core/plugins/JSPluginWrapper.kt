package com.intuit.player.jvm.core.plugins

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable

/**
 * [RuntimePlugin] extension that exposes an instance of the
 * underlying [Node] that represents the instantiated JS plugin.
 */
@Serializable(with = JSPluginWrapper.Serializer::class)
public interface JSPluginWrapper : RuntimePlugin, NodeWrapper {
    public val instance: Node

    override val node: Node get() = instance

    public object Serializer : NodeWrapperSerializer<JSPluginWrapper>({
        throw UnsupportedOperationException("not enough information to determine JSPluginWrapper implementation to deserialize into")
    })
}

@Deprecated(
    "Replaced with more generic JSPluginWrapper",
    ReplaceWith("JSPluginWrapper"),
    DeprecationLevel.HIDDEN,
)
public typealias JSPlayerPluginWrapper = JSPluginWrapper
