package com.intuit.playerui.core.resolver

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.validation.Validation
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.nullable

@Serializable(with = ResolveOptions.Serializer::class)
public class ResolveOptions(
    override val node: Node,
) : NodeWrapper {
    public val validation: Validation? by NodeSerializableField(Validation.serializer().nullable)

    internal object Serializer : NodeWrapperSerializer<ResolveOptions>(::ResolveOptions)
}
