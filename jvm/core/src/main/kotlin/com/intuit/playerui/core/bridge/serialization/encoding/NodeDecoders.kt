package com.intuit.playerui.core.bridge.serialization.encoding

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.serialization.format.RuntimeDecodingException
import com.intuit.playerui.core.bridge.serialization.format.RuntimeEncodingException
import com.intuit.playerui.core.bridge.serialization.format.RuntimeFormat
import com.intuit.playerui.core.bridge.serialization.json.value
import com.intuit.playerui.core.utils.InternalPlayerApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlin.reflect.KCallable

/** Simple extension of a [Decoder] to provide serializers a way to decode a [Node] */
public interface NodeDecoder : Decoder, FunctionDecoder {

    /** Decodes a [Node] value, where [Node] represents a Map-like structure */
    public fun decodeNode(): Node

    /** Fallback method to allow the decoder to decode the current value into whatever type of structure it can */
    public fun decodeValue(): Any?
}

public fun Decoder.requireNodeDecoder(): NodeDecoder = this as? NodeDecoder
    ?: throw RuntimeDecodingException("operation requires a NodeDecoder: ${this::class.simpleName}")

/** Simple extension of an [Encoder] to provide serializers a way to encode a backing [Node] */
public interface NodeEncoder : Encoder, FunctionEncoder {

    public fun encodeValue(value: Any)

    public fun encodeNode(value: Node)
}

public fun Encoder.requireNodeEncoder(): NodeEncoder = this as? NodeEncoder
    ?: throw RuntimeEncodingException("operation requires a NodeEncoder: ${this::class.simpleName}")

public interface FunctionEncoder : Encoder {

    // TODO: Can we encodeFunctions such that we can get the original function instance back on decode?
    //       We actually can by checking if it's a host function (then we could probably get the actual
    //       host function impl back, maybe even the method reference if it's enhanced
    public fun encodeFunction(any: Any?) {
        when (any) {
            is KCallable<*> -> encodeFunction(any)
            is Invokable<*> -> encodeFunction(any)
            is Function<*> -> encodeFunction(any)
            null -> encodeNull()
            else -> throw SerializationException("can only decode functions of types: [Invokable<*>, Function<*>, KCallable<*>]")
        }
    }

    public fun encodeFunction(invokable: Invokable<*>)

    public fun encodeFunction(kCallable: KCallable<*>)

    public fun encodeFunction(function: Function<*>)
}

public interface FunctionDecoder : Decoder {
    public fun <R> decodeFunction(returnTypeSerializer: KSerializer<R>): Invokable<R>
}

@InternalPlayerApi
public interface RuntimeValueDecoder<T> : NodeDecoder {

    /** Format the contains current configuration for decoding the [value] */
    public val format: RuntimeFormat<T>

    /** The entire [value] to decode */
    public val value: T

    /** The current [value] to decode */
    public val currentValue: T get() = value
}

@InternalPlayerApi
public interface RuntimeValueCompositeDecoder<T> : RuntimeValueDecoder<T>
