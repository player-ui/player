package com.intuit.playerui.core.validation

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.resolver.Resolver
import com.intuit.playerui.core.validation.Validation.Serializer
import kotlinx.serialization.Serializable

/** Limited definition of the player validation object exposed by [Resolver.Hooks.resolveOptions] */
@Serializable(with = Serializer::class)
public class Validation internal constructor(override val node: Node) : NodeWrapper {
    /** get all outstanding validations on current flow */
    public fun getAll(): ValidationMapping? = node.getInvokable<ValidationMapping?>("getAll")!!()

    internal object Serializer : NodeWrapperSerializer<Validation>(::Validation)
}

public fun Validation.getWarningsAndErrors(): ValidationMapping? = getAll()
