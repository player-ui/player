package com.intuit.player.jvm.graaljs.bridge.serialization.encoding

import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.serialization.encoding.AbstractRuntimeArrayListDecoder
import com.intuit.player.jvm.core.bridge.serialization.encoding.AbstractRuntimeObjectClassDecoder
import com.intuit.player.jvm.core.bridge.serialization.encoding.AbstractRuntimeObjectMapDecoder
import com.intuit.player.jvm.core.bridge.serialization.encoding.AbstractRuntimeValueDecoder
import com.intuit.player.jvm.core.bridge.serialization.encoding.NodeDecoder
import com.intuit.player.jvm.core.experimental.RuntimeClassDiscriminator
import com.intuit.player.jvm.graaljs.bridge.runtime.GraalRuntime.Companion.undefined
import com.intuit.player.jvm.graaljs.bridge.serialization.format.GraalDecodingException
import com.intuit.player.jvm.graaljs.bridge.serialization.format.GraalFormat
import com.intuit.player.jvm.graaljs.extensions.blockingLock
import com.intuit.player.jvm.graaljs.extensions.handleValue
import com.intuit.player.jvm.graaljs.extensions.toInvokable
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PolymorphicKind
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.StructureKind
import kotlinx.serialization.encoding.CompositeDecoder
import kotlinx.serialization.encoding.Decoder
import org.graalvm.polyglot.Value

internal fun <T> GraalFormat.readValue(element: Value, deserializer: DeserializationStrategy<T>): T =
    GraalValueDecoder(this, element).decodeSerializableValue(deserializer)

internal sealed class AbstractGraalDecoder(
    override val format: GraalFormat,
    override val value: Value,
) : AbstractRuntimeValueDecoder<Value>() {

    override fun decodeValue(): Any? = currentValue.handleValue(format)

    override fun decodeNotNullMark(): Boolean = !currentValue.isNull && currentValue != format.context.undefined

    override fun beginStructure(descriptor: SerialDescriptor): CompositeDecoder = when (descriptor.kind) {
        StructureKind.LIST -> GraalArrayListDecoder(format, currentValue)
        StructureKind.MAP -> GraalObjectMapDecoder(format, currentValue)
        StructureKind.CLASS -> GraalObjectClassDecoder(format, currentValue)
        PolymorphicKind.SEALED -> GraalSealedClassDecoder(format, currentValue)
        else -> error("Runtime format decoders can't decode kinds of (${descriptor.kind}) into structures for $descriptor")
    }

    override fun <R> decodeFunction(returnTypeSerializer: KSerializer<R>): Invokable<R> {
        return currentValue.toInvokable(format, returnTypeSerializer) ?: error("Unable to decode Graal function using return type serializer ${returnTypeSerializer.descriptor}")
    }
}

internal class GraalValueDecoder(format: GraalFormat, value: Value) : AbstractGraalDecoder(format, value)

internal class GraalObjectMapDecoder(override val format: GraalFormat, override val value: Value) : AbstractRuntimeObjectMapDecoder<Value>(), NodeDecoder by GraalValueDecoder(format, value) {
    override fun getElementAtIndex(index: Int): Value = value.blockingLock {
        getMember(getKeyAtIndex(index))
    }

    override val keys: List<String> = value.blockingLock {
        memberKeys.toList()
    }

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? = value.blockingLock {
        decodeElement(descriptor, index).handleValue(format)
    }

    override fun decodeElement(descriptor: SerialDescriptor, index: Int): Value = value.blockingLock {
        getMember(descriptor.getElementName(index))
    }

    override fun <T> buildDecoderForSerializableElement(
        descriptor: SerialDescriptor,
        index: Int,
        deserializer: DeserializationStrategy<T>,
    ): Decoder = when (index % 2 == 0) {
        true -> GraalValueDecoder(format, format.context.asValue(getKeyAtIndex(index)))
        false -> GraalValueDecoder(format, getElementAtIndex(index))
    }
}

internal class GraalArrayListDecoder(override val format: GraalFormat, override val value: Value) : AbstractRuntimeArrayListDecoder<Value>(), NodeDecoder by GraalValueDecoder(format, value) {
    override fun getElementAtIndex(index: Int): Value = value.blockingLock {
        getArrayElement(index.toLong())
    }

    override val keys: List<Int> = value.blockingLock {
        (0 until arraySize).map { it.toInt() }
    }

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? =
        decodeElement(descriptor, index).handleValue(format)

    override fun <T> buildDecoderForSerializableElement(
        descriptor: SerialDescriptor,
        index: Int,
        deserializer: DeserializationStrategy<T>,
    ): Decoder =
        GraalValueDecoder(format, decodeElement(descriptor, index))
}

internal class GraalObjectClassDecoder(override val format: GraalFormat, override val value: Value) : AbstractRuntimeObjectClassDecoder<Value>(), NodeDecoder by GraalValueDecoder(format, value) {
    override fun getElementAtIndex(index: Int): Value = value.blockingLock {
        getMember(getKeyAtIndex(index))
    }

    override val keys: List<String> = value.blockingLock {
        memberKeys.toList().filter { getMember(it) != context.undefined }
    }

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? =
        decodeElement(descriptor, index).handleValue(format)

    override fun decodeElement(descriptor: SerialDescriptor, index: Int): Value = value.blockingLock {
        getMember(descriptor.getElementName(index))
    }

    override fun <T> buildDecoderForSerializableElement(
        descriptor: SerialDescriptor,
        index: Int,
        deserializer: DeserializationStrategy<T>,
    ): Decoder = GraalValueDecoder(format, decodeElement(descriptor, index))
}

internal class GraalSealedClassDecoder(override val format: GraalFormat, override val value: Value) : AbstractRuntimeObjectClassDecoder<Value>(), NodeDecoder by GraalValueDecoder(format, value) {
    override fun getElementAtIndex(index: Int): Value = throw GraalDecodingException("GraalSealedClassDecoder should not be used to decode any elements")

    override val keys: List<String> = listOf("type", "value")

    override fun decodeElement(descriptor: SerialDescriptor, index: Int): Value = throw GraalDecodingException("GraalSealedClassDecoder should not be used to decode any elements")

    override fun <T> buildDecoderForSerializableElement(
        descriptor: SerialDescriptor,
        index: Int,
        deserializer: DeserializationStrategy<T>,
    ): Decoder = GraalValueDecoder(format, value)

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? {
        val discriminator = (
            descriptor.annotations.firstOrNull {
                it is RuntimeClassDiscriminator
            } as? RuntimeClassDiscriminator
            )?.discriminator ?: format.config.discriminator

        return value.getMember(discriminator).handleValue(format)
    }
}
