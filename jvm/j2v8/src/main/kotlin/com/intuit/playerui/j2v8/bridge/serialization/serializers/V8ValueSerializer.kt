package com.intuit.playerui.j2v8.bridge.serialization.serializers

import com.eclipsesource.v8.V8Value
import com.intuit.playerui.core.bridge.serialization.encoding.requireNodeEncoder
import com.intuit.playerui.j2v8.bridge.serialization.encoding.AbstractV8Decoder
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializer(forClass = V8Value::class)
internal object V8ValueSerializer : KSerializer<V8Value> {

    fun <T> conform(): KSerializer<T> = this as KSerializer<T>

    override val descriptor: SerialDescriptor =
        buildClassSerialDescriptor("com.eclipsesource.v8.V8Value")

    override fun serialize(encoder: Encoder, value: V8Value): Unit = encoder
        .requireNodeEncoder()
        .encodeValue(value)

    override fun deserialize(decoder: Decoder): V8Value =
        (decoder as AbstractV8Decoder).value
}
