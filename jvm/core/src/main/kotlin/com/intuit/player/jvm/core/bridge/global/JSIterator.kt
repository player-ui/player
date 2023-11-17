package com.intuit.player.jvm.core.bridge.global

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable

@Serializable(JSIterator.Serializer::class)
public class JSIterator<T>(override val node: Node, public val itemSerializer: KSerializer<T>) :
    Iterator<T>,
    NodeWrapper {

    @Serializable
    private data class NextResult<T>(
        val done: Boolean = false,
        val value: T? = null,
    )

    private fun getNext(): NextResult<T> = node
        .getInvokable<Node>("next")!!()
        .deserialize(NextResult.serializer(itemSerializer))

    /** Always keeps track of value to be read */
    private var current: NextResult<T> = getNext()

    override fun hasNext(): Boolean = !current.done

    override fun next(): T = current.value.apply {
        current = getNext()
    }!!

    public class Serializer<T>(public val itemSerializer: KSerializer<T>) : NodeWrapperSerializer<JSIterator<T>>({
        JSIterator(it, itemSerializer)
    })
}
