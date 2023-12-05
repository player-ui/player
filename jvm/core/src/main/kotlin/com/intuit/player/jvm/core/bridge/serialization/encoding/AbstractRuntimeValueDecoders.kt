package com.intuit.player.jvm.core.bridge.serialization.encoding

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeDecodingException
import com.intuit.player.jvm.core.bridge.serialization.json.isJsonElementSerializer
import com.intuit.player.jvm.core.bridge.serialization.json.value
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.core.utils.InternalPlayerApi
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.PolymorphicSerializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.CompositeDecoder
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.modules.SerializersModule
import kotlin.reflect.full.isSubclassOf

// TODO: Better support for nullish values
/** Common decoder base implementation to support decoding [T] runtime objects */
@InternalPlayerApi
public abstract class AbstractRuntimeValueDecoder<T> : RuntimeValueDecoder<T> {

    override val serializersModule: SerializersModule get() = format.serializersModule

    @Suppress("UNCHECKED_CAST")
    override fun <T> decodeSerializableValue(deserializer: DeserializationStrategy<T>): T = when {
        deserializer is PolymorphicSerializer<*> -> when {
            deserializer.baseClass.isSubclassOf(Function::class) -> decodeFunction(GenericSerializer())
            deserializer.baseClass.isSubclassOf(Node::class) -> decodeNode()
            else -> super.decodeSerializableValue(deserializer)
        } as T

        // handle json serializers separately because they don't support custom decoders
        deserializer.isJsonElementSerializer -> when {
            decodeNotNullMark() -> Json.encodeToJsonElement(GenericSerializer(), decodeValue())
            else -> JsonNull
        } as T

        else -> super.decodeSerializableValue(deserializer)
    }

    override fun decodeNull(): Nothing? = null
    override fun decodeBoolean(): Boolean = decode()
    override fun decodeByte(): Byte = decode()
    override fun decodeChar(): Char = decode()
    override fun decodeDouble(): Double = decode<Number>().toDouble()
    override fun decodeFloat(): Float = decode<Number>().toFloat()
    override fun decodeInt(): Int = decode<Number>().toInt()
    override fun decodeLong(): Long = decode<Number>().toLong()
    override fun decodeShort(): Short = decode<Number>().toShort()
    override fun decodeString(): String = decode()
    override fun decodeNode(): Node = decode()

    override fun decodeEnum(enumDescriptor: SerialDescriptor): Int = enumDescriptor.getElementIndex(decode())

    override fun decodeInline(inlineDescriptor: SerialDescriptor): Decoder = this

    /** Helper for decoding certain types */
    protected inline fun <reified T> decode(): T = when (val value = decodeValue()) {
        is T -> value
        else -> error("value ($value) cannot be decoded as ${T::class.simpleName}")
    }

    protected inline fun error(message: String?, cause: Throwable? = null): Nothing =
        throw RuntimeDecodingException(message, cause)
}

/** Generic base class extending the standardized decoding constructs required for composite decoding */
@InternalPlayerApi
public sealed class AbstractRuntimeValueCompositeDecoder<T, K> : RuntimeValueCompositeDecoder<T>, CompositeDecoder, NodeDecoder {

    /** Represents the current index in the [value] to decode */
    protected var currentIndex: Int = -1

    /** Get the current [Any?] value at [currentIndex], if [currentIndex] is either NOT_STARTED or DONE, this represents the entire [value] */
    override val currentValue: T get() = if (currentKey != null) currentElement else value

    /** Get the current [K] key at [currentIndex] */
    protected val currentKey: K get() = getKeyAtIndex(currentIndex)

    /** Get the current [V] element at [currentIndex] */
    protected val currentElement: T get() = getElementAtIndex(currentIndex)

    /** Get the [V] element at [index] */
    protected abstract fun getElementAtIndex(index: Int): T

    /** Get the [K] key at [index] */
    protected open fun getKeyAtIndex(index: Int): K = keys[index]

    /** Ordered collection of [K] keys, indexed by [currentIndex] */
    protected abstract val keys: List<K>

    /** Size of the [value] to be decoded, defaults to size of [keys] */
    protected open val size: Int by lazy {
        keys.size
    }

    override fun decodeCollectionSize(descriptor: SerialDescriptor): Int = size

    override fun decodeElementIndex(descriptor: SerialDescriptor): Int = when {
        currentIndex++ < size - 1 -> currentIndex
        else -> CompositeDecoder.DECODE_DONE
    }

    public abstract fun decodeValueElement(descriptor: SerialDescriptor, index: Int): Any?

    /** Get the [V] element that corresponds to the key within the [descriptor] at [index] */
    public abstract fun decodeElement(descriptor: SerialDescriptor, index: Int): T

    override fun decodeBooleanElement(descriptor: SerialDescriptor, index: Int): Boolean = decode(descriptor, index)
    override fun decodeByteElement(descriptor: SerialDescriptor, index: Int): Byte = decode(descriptor, index)
    override fun decodeCharElement(descriptor: SerialDescriptor, index: Int): Char = decode(descriptor, index)
    override fun decodeDoubleElement(descriptor: SerialDescriptor, index: Int): Double = decode<Number>(descriptor, index).toDouble()
    override fun decodeFloatElement(descriptor: SerialDescriptor, index: Int): Float = decode<Number>(descriptor, index).toFloat()
    override fun decodeIntElement(descriptor: SerialDescriptor, index: Int): Int = decode<Number>(descriptor, index).toInt()
    override fun decodeLongElement(descriptor: SerialDescriptor, index: Int): Long = decode<Number>(descriptor, index).toLong()
    override fun decodeShortElement(descriptor: SerialDescriptor, index: Int): Short = decode<Number>(descriptor, index).toShort()
    override fun decodeStringElement(descriptor: SerialDescriptor, index: Int): String = decode(descriptor, index)
    override fun endStructure(descriptor: SerialDescriptor): Unit = Unit

    /** Build a decoder for the [currentIndex], which could be for [currentKey] or [currentValue] */
    public abstract fun <T> buildDecoderForSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>): Decoder

    override fun <T> decodeSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T>, previousValue: T?): T =
        buildDecoderForSerializableElement(descriptor, index, deserializer).decodeSerializableValue(deserializer)

    override fun <T : Any> decodeNullableSerializableElement(descriptor: SerialDescriptor, index: Int, deserializer: DeserializationStrategy<T?>, previousValue: T?): T? =
        buildDecoderForSerializableElement(descriptor, index, deserializer).decodeNullableSerializableValue(deserializer)

    override fun decodeInlineElement(descriptor: SerialDescriptor, index: Int): Decoder = decodeInline(descriptor)

    /** Helper for decoding certain types for the value at [index] within the [descriptor] */
    protected inline fun <reified T> decode(descriptor: SerialDescriptor, index: Int): T = when (val value = decodeValueElement(descriptor, index)) {
        is T -> value
        else -> error("value ($value) cannot be decoded as ${T::class.simpleName}")
    }
}

/** Map-like [value] composite decoder which handles decoding keys & values */
@InternalPlayerApi
public abstract class AbstractRuntimeObjectMapDecoder<T> : AbstractRuntimeValueCompositeDecoder<T, String>() {
    override val size: Int by lazy {
        keys.size * 2
    }

    override fun decodeCollectionSize(descriptor: SerialDescriptor): Int = keys.size

    override fun getKeyAtIndex(index: Int): String = keys[index / 2]
}

/** List-like [value] composite decoder which handles decoding values at [Int] indexes */
@InternalPlayerApi
public abstract class AbstractRuntimeArrayListDecoder<T> : AbstractRuntimeValueCompositeDecoder<T, Int>() {
    override fun decodeElement(descriptor: SerialDescriptor, index: Int): T =
        getElementAtIndex(index)
}

/** Map-like [value] composite decoder which strictly handles class-based serializers for decoding values into named members */
@InternalPlayerApi
public abstract class AbstractRuntimeObjectClassDecoder<T> : AbstractRuntimeValueCompositeDecoder<T, String>() {
    override fun decodeElementIndex(descriptor: SerialDescriptor): Int = when {
        currentIndex++ < size - 1 -> when (val index = descriptor.getElementIndex(currentKey)) {
            /** current key is not found in the descriptor, so check next key */
            CompositeDecoder.UNKNOWN_NAME -> decodeElementIndex(descriptor)
            else -> index
        }
        else -> CompositeDecoder.DECODE_DONE
    }
}
