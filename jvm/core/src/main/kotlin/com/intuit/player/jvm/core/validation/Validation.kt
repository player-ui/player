package com.intuit.player.jvm.core.validation

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.resolver.Resolver
import kotlinx.serialization.Serializable

/** Limited definition of the player validation object exposed by [Resolver.Hooks.resolveOptions] */
@Serializable(with = Validation.Serializer::class)
public class Validation internal constructor(override val node: Node) : NodeWrapper {
    /** get all outstanding validations on current flow */
    public fun getAll(): ValidationMapping? = node.getInvokable<ValidationMapping?>("getAll")!!()

    internal object Serializer : NodeWrapperSerializer<Validation>(::Validation)
}

public fun Validation.getWarningsAndErrors(): ValidationMapping? = getAll()
