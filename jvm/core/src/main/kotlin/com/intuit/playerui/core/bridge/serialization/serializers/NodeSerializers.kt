package com.intuit.playerui.core.bridge.serialization.serializers

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.encoding.NodeEncoder
import com.intuit.playerui.core.bridge.serialization.encoding.requireNodeDecoder
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

public class NodeSerializer : KSerializer<Node> {
    private val structureSerializer = MapSerializer(String.serializer(), GenericSerializer())

    override val descriptor: SerialDescriptor = structureSerializer.descriptor

    override fun deserialize(decoder: Decoder): Node = decoder.requireNodeDecoder().decodeNode()

    override fun serialize(encoder: Encoder, value: Node) {
        when (encoder) {
            is NodeEncoder -> encoder.encodeNode(value)
            else -> encoder.encodeSerializableValue(structureSerializer, value)
        }
    }
}

public open class NodeWrapperSerializer<T : NodeWrapper>(
    private val factory: (Node) -> T,
    // TODO: Can we pull this from the @SerialName annotation?
    private val serialName: String = "com.intuit.playerui.core.bridge.NodeWrapper",
) : KSerializer<T> {
    final override val descriptor: SerialDescriptor = buildClassSerialDescriptor(serialName)

    override fun deserialize(decoder: Decoder): T = NodeSerializer().deserialize(decoder).let(factory)

    final override fun serialize(encoder: Encoder, value: T): Unit = NodeSerializer().serialize(encoder, value.node)

    public companion object {
        public operator fun <T : NodeWrapper> invoke(factory: (Node) -> T): NodeWrapperSerializer<T> =
            object : NodeWrapperSerializer<T>(factory) {}
    }
}

public abstract class PolymorphicNodeWrapperSerializer<T : NodeWrapper> :
    NodeWrapperSerializer<T>({ throw SerializationException("factory should never be used for polymorphic node deserialization") }) {
    final override fun deserialize(decoder: Decoder): T = decoder
        .requireNodeDecoder()
        .decodeNode()
        .let(::selectDeserializer)
        .deserialize(decoder)

    public abstract fun selectDeserializer(node: Node): KSerializer<out T>
}
