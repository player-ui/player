package com.intuit.playerui.core.validation

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.validation.BindingInstance.Serializer
import kotlinx.serialization.Serializable

@Serializable(with = Serializer::class)
public class BindingInstance(override val node: Node) : NodeWrapper {

    public fun asString(): String = node.getInvokable<String>("asString")!!()

    public fun parent(): BindingInstance? = node.getInvokable<BindingInstance>("parent")?.invoke()

    override fun toString(): String = asString()

    internal object Serializer : NodeWrapperSerializer<BindingInstance>(::BindingInstance)
}
