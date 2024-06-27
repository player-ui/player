package com.intuit.playerui.jsi.serialization.encoding

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.serialization.encoding.AbstractRuntimeArrayListDecoder
import com.intuit.playerui.core.bridge.serialization.encoding.AbstractRuntimeObjectClassDecoder
import com.intuit.playerui.core.bridge.serialization.encoding.AbstractRuntimeObjectMapDecoder
import com.intuit.playerui.core.bridge.serialization.encoding.AbstractRuntimeValueDecoder
import com.intuit.playerui.core.bridge.serialization.encoding.NodeDecoder
import com.intuit.playerui.core.experimental.RuntimeClassDiscriminator
import com.intuit.playerui.hermes.extensions.handleValue
import com.intuit.playerui.hermes.extensions.toInvokable
import com.intuit.playerui.jsi.Array
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.format.JSIDecodingException
import com.intuit.playerui.jsi.serialization.format.JSIFormat
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PolymorphicKind
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.StructureKind
import kotlinx.serialization.encoding.CompositeDecoder

internal fun <T> JSIFormat.readFromValue(element: Value, deserializer: DeserializationStrategy<T>): T =
    JSIValueDecoder(this, element).decodeSerializableValue(deserializer)

internal sealed class AbstractJSIValueDecoder(
    override val format: JSIFormat,
    override val value: Value,
) : AbstractRuntimeValueDecoder<Value>() {

    override fun decodeValue(): Any? = currentValue.handleValue(format)

    override fun decodeNotNullMark(): Boolean = !currentValue.isNull() && !currentValue.isUndefined()

    override fun beginStructure(descriptor: SerialDescriptor): CompositeDecoder = when (descriptor.kind) {
        // TODO: The _as_ APIs will throw a CppException, we'll likely just want to wrap that ourselves
        StructureKind.LIST -> JSIArrayListDecoder(format, currentValue)
        StructureKind.MAP -> JSIObjectMapDecoder(format, currentValue)
        StructureKind.CLASS -> JSIObjectClassDecoder(format, currentValue)
        PolymorphicKind.SEALED -> JSISealedClassDecoder(format, currentValue)
        else -> error("Runtime format decoders can't decode kinds of (${descriptor.kind}) into structures for $descriptor")
    }

    override fun <R> decodeFunction(returnTypeSerializer: KSerializer<R>): Invokable<R> {
        return currentValue.asObject(format.runtime).asFunction(format.runtime).toInvokable(format, returnTypeSerializer) ?: error("Unable to decode V8 function using return type serializer ${returnTypeSerializer.descriptor}")
    }
}

/** Simple implementation of [AbstractV8Decoder] can be treated as the entry point for [value] decoding */
internal class JSIValueDecoder(format: JSIFormat, value: Value) : AbstractJSIValueDecoder(format, value)

internal class JSIObjectMapDecoder(override val format: JSIFormat, override val value: Value, private val jsiObject: Object) : AbstractRuntimeObjectMapDecoder<Value>(), NodeDecoder by JSIValueDecoder(format, value) {

    constructor(format: JSIFormat, value: Value) : this(format, value, value.asObject(format.runtime))

    override val keys: List<String> by lazy {
        // TODO: Consolidate w/ HermesNode::keys
        val names = jsiObject.getPropertyNames(format.runtime)
        val size = names.size(format.runtime)

        (0..size).map { i -> names.getValueAtIndex(format.runtime, i) }
            .filterNot(Value::isUndefined)
            .map { it.toString(format.runtime) }
    }

    override fun getElementAtIndex(index: Int): Value = jsiObject.getProperty(format.runtime, getKeyAtIndex(index))

    override fun decodeElement(descriptor: SerialDescriptor, index: Int): Value =
        jsiObject.getProperty(format.runtime, descriptor.getElementName(index))

    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): JSIValueDecoder = when (index % 2 == 0) {
        true -> JSIValueDecoder(format, Value.from(format.runtime, getKeyAtIndex(index)))
        false -> JSIValueDecoder(format, getElementAtIndex(index))
    }

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? =
        decodeElement(descriptor, index).handleValue(format)
}

internal class JSIArrayListDecoder(override val format: JSIFormat, override val value: Value, private val array: Array) : AbstractRuntimeArrayListDecoder<Value>(), NodeDecoder by JSIValueDecoder(format, value) {

    constructor(format: JSIFormat, value: Value) : this(format, value, value.asObject(format.runtime).asArray(format.runtime))

    // ASSUMPTION: All array keys will just be incremental ints from 0 -> size - 1
    override val keys: List<Int> by lazy { (0 until array.size(format.runtime)).toList() }

    override fun getElementAtIndex(index: Int): Value = array.getValueAtIndex(format.runtime, getKeyAtIndex(index))

    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): JSIValueDecoder =
        JSIValueDecoder(format, decodeElement(descriptor, index))

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? =
        decodeElement(descriptor, index).handleValue(format)
}

internal class JSIObjectClassDecoder(override val format: JSIFormat, override val value: Value, private val jsiObject: Object) : AbstractRuntimeObjectClassDecoder<Value>(), NodeDecoder by JSIValueDecoder(format, value) {

    constructor(format: JSIFormat, value: Value) : this(format, value, value.asObject(format.runtime))

    override val keys: List<String> by lazy {
        // TODO: Consolidate w/ HermesNode::keys
        val names = jsiObject.getPropertyNames(format.runtime)
        val size = names.size(format.runtime)

        (0..size).map { i -> names.getValueAtIndex(format.runtime, i) }
            .filterNot(Value::isUndefined)
            .map { it.toString(format.runtime) }
    }

    override fun getElementAtIndex(index: Int): Value = jsiObject.getProperty(format.runtime, getKeyAtIndex(index))

    override fun decodeElement(descriptor: SerialDescriptor, index: Int): Value =
        jsiObject.getProperty(format.runtime, descriptor.getElementName(index))

    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): JSIValueDecoder =
        JSIValueDecoder(format, decodeElement(descriptor, index))

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? =
        decodeElement(descriptor, index).handleValue(format)
}

internal class JSISealedClassDecoder(override val format: JSIFormat, override val value: Value, private val jsiObject: Object) : AbstractRuntimeObjectClassDecoder<Value>(), NodeDecoder by JSIValueDecoder(format, value) {

    constructor(format: JSIFormat, value: Value) : this(format, value, value.asObject(format.runtime))

    override val keys: List<String> = listOf("type", "value")

    override fun getElementAtIndex(index: Int): Value = throw JSIDecodingException("JSISealedClassDecoder should not be used to decode any elements")

    override fun decodeElement(descriptor: SerialDescriptor, index: Int): Value = throw JSIDecodingException("JSISealedClassDecoder should not be used to decode any elements")

    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): JSIValueDecoder =
        JSIValueDecoder(format, value)

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? {
        val discriminator = (
            descriptor.annotations.firstOrNull {
                it is RuntimeClassDiscriminator
            } as? RuntimeClassDiscriminator
            )?.discriminator ?: format.config.discriminator

        return jsiObject.getProperty(format.runtime, discriminator).handleValue(format)
    }
}
