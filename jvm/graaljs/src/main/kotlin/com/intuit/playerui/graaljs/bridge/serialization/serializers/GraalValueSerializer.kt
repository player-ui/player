package com.intuit.playerui.graaljs.bridge.serialization.serializers

import com.intuit.playerui.core.bridge.serialization.encoding.requireNodeEncoder
import com.intuit.playerui.graaljs.bridge.serialization.encoding.AbstractGraalDecoder
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import org.graalvm.polyglot.Value

@Serializer(forClass = Value::class)
internal object GraalValueSerializer : KSerializer<Value> {
    override fun deserialize(decoder: Decoder): Value = (decoder as AbstractGraalDecoder).value

    override val descriptor: SerialDescriptor =
        buildClassSerialDescriptor("org.graalvm.polyglot.Value")

    override fun serialize(encoder: Encoder, value: Value) = encoder
        .requireNodeEncoder()
        .encodeValue(value)
}
