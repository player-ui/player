package com.intuit.playerui.jsi.serialization.encoding

import com.facebook.jni.CppException
import com.intuit.playerui.core.bridge.serialization.encoding.AbstractRuntimeArrayListDecoder
import com.intuit.playerui.core.bridge.serialization.encoding.AbstractRuntimeObjectClassDecoder
import com.intuit.playerui.core.bridge.serialization.encoding.AbstractRuntimeObjectMapDecoder
import com.intuit.playerui.core.bridge.serialization.encoding.AbstractRuntimeValueDecoder
import com.intuit.playerui.core.bridge.serialization.encoding.NodeDecoder
import com.intuit.playerui.core.bridge.serialization.encoding.RuntimeValueDecoder
import com.intuit.playerui.core.experimental.RuntimeClassDiscriminator
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.hermes.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.hermes.extensions.filteredKeys
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

private val RuntimeValueDecoder<Value>.runtime: HermesRuntime get() = (format as JSIFormat).runtime

internal sealed class AbstractJSIValueDecoder(
    override val format: JSIFormat,
    override val value: Value,
) : AbstractRuntimeValueDecoder<Value>() {

    override fun decodeValue(): Any? = runtime.evaluateInJSThreadBlocking {
        currentValue.handleValue(format)
    }

    override fun decodeNotNullMark(): Boolean = !currentValue.isNull() && !currentValue.isUndefined()

    override fun beginStructure(descriptor: SerialDescriptor): CompositeDecoder = runtime.evaluateInJSThreadBlocking {
        when {
            // Used for Unit
            descriptor.kind is StructureKind.OBJECT -> JSIObjectInstanceDecoder(format, currentValue)
            !currentValue.isObject() -> error("Current value is not a composite structure and can't be used to decode into $descriptor")
            descriptor.kind is StructureKind.LIST -> JSIArrayListDecoder(format, currentValue, currentValue.asObject(runtime).asArray(runtime))
            descriptor.kind is StructureKind.MAP -> JSIObjectMapDecoder(format, currentValue, currentValue.asObject(runtime))
            descriptor.kind is StructureKind.CLASS -> JSIObjectClassDecoder(format, currentValue, currentValue.asObject(runtime))
            descriptor.kind is PolymorphicKind.SEALED -> JSISealedClassDecoder(format, currentValue, currentValue.asObject(runtime))
            else -> error("Runtime format decoders can't decode kinds of (${descriptor.kind}) into structures for $descriptor")
        }
    }

    override fun <R> decodeFunction(returnTypeSerializer: KSerializer<R>) = runtime.evaluateInJSThreadBlocking {
        try {
            currentValue.asObject(runtime).asFunction(runtime)
                .toInvokable(format, currentValue.asObject(runtime), returnTypeSerializer)
        } catch (exception: CppException) {
            error("Unable to decode JSI function using return type serializer ${returnTypeSerializer.descriptor}", exception)
        }
    }
}

/** Simple implementation of [AbstractJSIValueDecoder] can be treated as the entry point for [value] decoding */
internal class JSIValueDecoder(format: JSIFormat, value: Value) : AbstractJSIValueDecoder(format, value)

internal class JSIObjectMapDecoder(override val format: JSIFormat, override val value: Value, private val jsiObject: Object) : AbstractRuntimeObjectMapDecoder<Value>(), NodeDecoder by JSIValueDecoder(format, value) {

    override val keys: List<String> by lazy {
        runtime.evaluateInJSThreadBlocking {
            jsiObject.filteredKeys(runtime)
        }.toList()
    }

    override fun getElementAtIndex(index: Int): Value = runtime.evaluateInJSThreadBlocking {
        jsiObject.getProperty(runtime, getKeyAtIndex(index))
    }

    // TODO: Evaluate ability to use context receiver here
    override fun decodeElement(descriptor: SerialDescriptor, index: Int): Value = runtime.evaluateInJSThreadBlocking {
        jsiObject.getProperty(runtime, descriptor.getElementName(index))
    }

    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): JSIValueDecoder = when (index % 2 == 0) {
        true -> JSIValueDecoder(format, runtime.evaluateInJSThreadBlocking { Value.from(runtime, getKeyAtIndex(index)) })
        false -> JSIValueDecoder(format, getElementAtIndex(index))
    }

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? = runtime.evaluateInJSThreadBlocking {
        decodeElement(descriptor, index).handleValue(format)
    }
}

internal class JSIArrayListDecoder(override val format: JSIFormat, override val value: Value, private val array: Array) : AbstractRuntimeArrayListDecoder<Value>(), NodeDecoder by JSIValueDecoder(format, value) {

    // ASSUMPTION: All array keys will just be incremental ints from 0 -> size - 1
    override val keys: List<Int> by lazy { (0 until runtime.evaluateInJSThreadBlocking { array.size(runtime) }).toList() }

    override fun getElementAtIndex(index: Int): Value = runtime.evaluateInJSThreadBlocking { array.getValueAtIndex(runtime, getKeyAtIndex(index)) }

    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): JSIValueDecoder =
        JSIValueDecoder(format, decodeElement(descriptor, index))

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? = runtime.evaluateInJSThreadBlocking {
        decodeElement(descriptor, index).handleValue(format)
    }
}

internal class JSIObjectClassDecoder(override val format: JSIFormat, override val value: Value, private val jsiObject: Object) : AbstractRuntimeObjectClassDecoder<Value>(), NodeDecoder by JSIValueDecoder(format, value) {

    override val keys: List<String> by lazy {
        runtime.evaluateInJSThreadBlocking {
            jsiObject.filteredKeys(runtime)
        }.toList()
    }

    override fun getElementAtIndex(index: Int): Value = runtime.evaluateInJSThreadBlocking {
        jsiObject.getProperty(runtime, getKeyAtIndex(index))
    }

    override fun decodeElement(descriptor: SerialDescriptor, index: Int): Value = runtime.evaluateInJSThreadBlocking {
        jsiObject.getProperty(runtime, descriptor.getElementName(index))
    }

    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): JSIValueDecoder =
        JSIValueDecoder(format, decodeElement(descriptor, index))

    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any? = runtime.evaluateInJSThreadBlocking {
        decodeElement(descriptor, index).handleValue(format)
    }
}

internal class JSISealedClassDecoder(override val format: JSIFormat, override val value: Value, private val jsiObject: Object) : AbstractRuntimeObjectClassDecoder<Value>(), NodeDecoder by JSIValueDecoder(format, value) {

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

        return runtime.evaluateInJSThreadBlocking {
            jsiObject.getProperty(runtime, discriminator).handleValue(format)
        }
    }
}

internal class JSIObjectInstanceDecoder(override val format: JSIFormat, override val value: Value) : AbstractRuntimeObjectClassDecoder<Value>(), NodeDecoder by JSIValueDecoder(format, value) {

    override val keys: List<String> = emptyList()

    override fun getElementAtIndex(index: Int): Value = error()
    override fun decodeElement(descriptor: SerialDescriptor, index: Int): Value = error()
    override fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): JSIValueDecoder = error()
    override fun decodeValueElement(descriptor: SerialDescriptor, index: Int) = error()

    private fun error(): Nothing = throw JSIDecodingException("JSIObjectInstanceDecoder should not be used to decode any elements")
}
