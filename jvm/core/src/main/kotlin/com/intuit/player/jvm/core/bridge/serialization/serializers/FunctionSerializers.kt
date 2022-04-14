package com.intuit.player.jvm.core.bridge.serialization.serializers

import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.serialization.encoding.requireNodeDecoder
import com.intuit.player.jvm.core.bridge.serialization.encoding.requireNodeEncoder
import kotlinx.serialization.InternalSerializationApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PolymorphicKind
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlin.reflect.KCallable

public sealed class FunctionLikeSerializer<T> : KSerializer<T> {

    final override val descriptor: SerialDescriptor = FunctionLikeSerializer.descriptor

    override fun deserialize(decoder: Decoder): T = decoder.requireNodeDecoder().decodeFunction() as T

    override fun serialize(encoder: Encoder, value: T) {
        encoder.requireNodeEncoder().encodeFunction(value)
    }

    public companion object {
        @OptIn(InternalSerializationApi::class)
        public val descriptor: SerialDescriptor = buildSerialDescriptor("FunctionLike", PolymorphicKind.OPEN) {}
    }
}

public class KCallableSerializer<R> : FunctionLikeSerializer<KCallable<R>>()
public class InvokableSerializer<R> : FunctionLikeSerializer<Invokable<R>>()
public class FunctionSerializer<R> : FunctionLikeSerializer<Function<R>>()

public inline fun <R, reified T : Function<R>> functionSerializer(): KSerializer<T> = object : KSerializer<T> by FunctionSerializer<R>() as KSerializer<T> {
    override val descriptor: SerialDescriptor = SerialDescriptor(T::class.qualifiedName!!, FunctionSerializer<R>().descriptor)
}
