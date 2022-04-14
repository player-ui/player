package com.intuit.player.jvm.core.resolver

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.validation.Validation
import kotlinx.serialization.Serializable

@Serializable(with = ResolveOptions.Serializer::class)
public class ResolveOptions(override val node: Node) : NodeWrapper {

    public val validation: Validation? get() = node.getSerializable("validation", Validation.serializer())

    internal object Serializer : NodeWrapperSerializer<ResolveOptions>(::ResolveOptions)
}
