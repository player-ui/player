package com.intuit.player.jvm.j2v8.bridge.serialization.encoding

import com.eclipsesource.v8.V8Array
import com.eclipsesource.v8.V8Object
import com.eclipsesource.v8.V8Value
import com.intuit.player.jvm.core.bridge.serialization.encoding.*
import com.intuit.player.jvm.core.experimental.RuntimeClassDiscriminator
import com.intuit.player.jvm.j2v8.*
import com.intuit.player.jvm.j2v8.bridge.serialization.format.J2V8DecodingException
import com.intuit.player.jvm.j2v8.bridge.serialization.format.J2V8Format
import com.intuit.player.jvm.j2v8.extensions.blockingLock
import com.intuit.player.jvm.j2v8.extensions.handleValue
import kotlinx.serialization.*
import kotlinx.serialization.descriptors.PolymorphicKind
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.StructureKind
import kotlinx.serialization.encoding.CompositeDecoder

internal fun <T> J2V8Format.readV8(element: V8Value, deserializer: DeserializationStrategy<T>): T =
    V8ValueDecoder(this, element).decodeSerializableValue(deserializer)

internal sealed class AbstractV8Decoder(
    override val format: J2V8Format,
    override val value: V8Value,
) : AbstractRuntimeValueDecoder<V8Value>() {

    override fun decodeValue(): Any? = currentValue.handleValue(format)

    override fun decodeNotNullMark(): Boolean = currentValue !is V8Null && !currentValue.isUndefined

    override fun beginStructure(descriptor: SerialDescriptor): CompositeDecoder = when (descriptor.kind) {
        StructureKind.LIST -> V8ArrayListDecoder(format, currentValue.v8Array)
        StructureKind.MAP -> V8ObjectMapDecoder(format, currentValue.v8Object)
        StructureKind.CLASS -> V8ObjectClassDecoder(format, currentValue.v8Object)
        PolymorphicKind.SEALED -> V8SealedClassDecoder(format, currentValue.v8Object)
        else -> error("Runtime format decoders can't decode kinds of (${descriptor.kind}) into structures for $descriptor")
    }
}

/** Simple implementation of [AbstractV8Decoder] can be treated as the entry point for [value] decoding */
internal class V8ValueDecoder(format: J2V8Format, value: V8Value) : AbstractV8Decoder(format, value)

internal class V8ObjectMapDecoder(override val format: J2V8Format, override val value: V8Object) : AbstractRuntimeObjectMapDecoder<V8Value>(), NodeDecoder by V8ValueDecoder(format, value) {

    override val keys: List<String> = value.blockingLock {
        keys.toList()
    }

    override fun getElementAtIndex(index: Int): V8Value = value.getV8Value(getKeyAtIndex(index))

    override fun decodeElement(descriptor: SerialDescriptor, index: Int): V8Value =
        value.getV8Value(descriptor.getElementName(index))

    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): V8ValueDecoder = when (index % 2 == 0) {
        true -> V8ValueDecoder(format, getKeyAtIndex(index).let(::V8Primitive))
        false -> V8ValueDecoder(format, getElementAtIndex(index))
    }

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? =
        decodeElement(descriptor, index).handleValue(format)
}

internal class V8ArrayListDecoder(override val format: J2V8Format, override val value: V8Array) : AbstractRuntimeArrayListDecoder<V8Value>(), NodeDecoder by V8ValueDecoder(format, value) {

    override val keys: List<Int> = value.blockingLock {
        keys.map(String::toInt)
    }

    override fun getElementAtIndex(index: Int): V8Value = value.getV8Value(getKeyAtIndex(index))

    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): V8ValueDecoder =
        V8ValueDecoder(format, decodeElement(descriptor, index))

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? =
        decodeElement(descriptor, index).handleValue(format)
}

internal class V8ObjectClassDecoder(override val format: J2V8Format, override val value: V8Object) : AbstractRuntimeObjectClassDecoder<V8Value>(), NodeDecoder by V8ValueDecoder(format, value) {

    override val keys: List<String> = value.blockingLock {
        keys.toList().filter { !value.getV8Value(it).isUndefined }
    }

    override fun getElementAtIndex(index: Int): V8Value = value.getV8Value(getKeyAtIndex(index))

    override fun decodeElement(descriptor: SerialDescriptor, index: Int): V8Value =
        value.getV8Value(descriptor.getElementName(index))

    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): V8ValueDecoder =
        V8ValueDecoder(format, decodeElement(descriptor, index))

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? =
        decodeElement(descriptor, index).handleValue(format)
}

internal class V8SealedClassDecoder(override val format: J2V8Format, override val value: V8Object) : AbstractRuntimeObjectClassDecoder<V8Value>(), NodeDecoder by V8ValueDecoder(format, value) {
    override val keys: List<String> = listOf("type", "value")

    override fun getElementAtIndex(index: Int): V8Value = throw J2V8DecodingException("V8SealedClassDecoder should not be used to decode any elements")

    override fun decodeElement(descriptor: SerialDescriptor, index: Int): V8Value = throw J2V8DecodingException("V8SealedClassDecoder should not be used to decode any elements")

    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): V8ValueDecoder =
        V8ValueDecoder(format, value)

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? {
        val discriminator = (
                descriptor.annotations.firstOrNull {
                    it is RuntimeClassDiscriminator
                } as? RuntimeClassDiscriminator
                )?.discriminator ?: format.config.discriminator

        return value.getV8Value(discriminator).handleValue(format)
    }
}
