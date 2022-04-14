package com.intuit.player.jvm.core.validation

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable

@Serializable(with = BindingInstance.Serializer::class)
public class BindingInstance(override val node: Node) : NodeWrapper {

    public fun asString(): String = node.getFunction<String>("asString")!!()

    public fun parent(): BindingInstance? = node.getFunction<BindingInstance>("parent")?.invoke()

    override fun toString(): String = asString()

    internal object Serializer : NodeWrapperSerializer<BindingInstance>(::BindingInstance)
}
