package com.intuit.playerui.jsi.serialization.serializers

import com.intuit.playerui.core.bridge.serialization.encoding.requireNodeEncoder
import com.intuit.playerui.jsi.JSIValueContainer
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.encoding.AbstractJSIValueDecoder
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializer(forClass = JSIValueContainer::class)
internal object JSIValueContainerSerializer : KSerializer<JSIValueContainer> {

    fun <T : JSIValueContainer> conform(): KSerializer<T> = this as KSerializer<T>

    override val descriptor: SerialDescriptor =
        buildClassSerialDescriptor("com.intuit.playerui.jsi.JSIValueContainer") {}

    override fun serialize(encoder: Encoder, value: JSIValueContainer): Unit = encoder
        .requireNodeEncoder()
        .encodeValue(value)

    override fun deserialize(decoder: Decoder): Value =
        (decoder as AbstractJSIValueDecoder).value
}
