package com.intuit.playerui.core.validation

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.validation.BindingInstance.Serializer
import kotlinx.serialization.Serializable

@Serializable(with = Serializer::class)
public class BindingInstance(
    override val node: Node,
) : NodeWrapper {
    private val asString: Invokable<String> by NodeSerializableFunction()
    private val parent: Invokable<BindingInstance>? by NodeSerializableFunction()

    public fun asString(): String = asString.invoke()

    public fun parent(): BindingInstance? = parent?.invoke()

    override fun toString(): String = asString()

    internal object Serializer : NodeWrapperSerializer<BindingInstance>(::BindingInstance)
}
