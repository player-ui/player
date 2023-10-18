package com.intuit.player.jvm.core.bridge.serialization.serializers

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.format.serializer
import com.intuit.player.jvm.core.player.PlayerException
import kotlinx.serialization.KSerializer
import kotlin.reflect.KProperty

internal class NodeSerializableField<T>(private val provider: () -> Node, private val serializer: KSerializer<T>, private val name: String? = null) {

    operator fun getValue(thisRef: Any?, property: KProperty<*>): T = provider()
        .getSerializable(name ?: property.name, serializer)
        ?: throw PlayerException("Could not deserialize $name")

    companion object {
        fun <T> NodeWrapper.NodeSerializableField(serializer: KSerializer<T>, name: String? = null) = NodeSerializableField(::node, serializer, name)

        inline fun <reified T> NodeWrapper.NodeSerializableField(name: String? = null) = NodeSerializableField(::node, node.format.serializer<T>(), name)
    }
}
