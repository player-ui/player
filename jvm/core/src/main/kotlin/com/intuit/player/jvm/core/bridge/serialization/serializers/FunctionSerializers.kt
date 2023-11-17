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
import kotlinx.serialization.modules.SerializersModule
import kotlin.reflect.KCallable

public sealed class FunctionLikeSerializer<T>(private val serializer: KSerializer<*>) : KSerializer<T> {

    final override val descriptor: SerialDescriptor = FunctionLikeSerializer.descriptor

    override fun deserialize(decoder: Decoder): T {
        return decoder.requireNodeDecoder().decodeFunction(serializer) as T
    }

    override fun serialize(encoder: Encoder, value: T) {
        encoder.requireNodeEncoder().encodeFunction(value)
    }

    public companion object {
        @OptIn(InternalSerializationApi::class)
        public val descriptor: SerialDescriptor = buildSerialDescriptor("FunctionLike", PolymorphicKind.OPEN) {}

        public val functionSerializerModule: SerializersModule = SerializersModule {
            contextual(KCallable::class) {
                KCallableSerializer(it.first())
            }
            contextual(Invokable::class) {
                InvokableSerializer(it.first())
            }
            contextual(Function0::class) {
                Function0Serializer(it[0])
            }
            contextual(Function1::class) {
                Function1Serializer(it[0], it[1])
            }
            contextual(Function2::class) {
                Function2Serializer(it[0], it[1], it[2])
            }
            contextual(Function3::class) {
                Function3Serializer(it[0], it[1], it[2], it[3])
            }
            contextual(Function4::class) {
                Function4Serializer(it[0], it[1], it[2], it[3], it[4])
            }
            contextual(Function5::class) {
                Function5Serializer(it[0], it[1], it[2], it[3], it[4], it[5])
            }
            contextual(Function6::class) {
                Function6Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6])
            }
            contextual(Function7::class) {
                Function7Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7])
            }
            contextual(Function8::class) {
                Function8Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8])
            }
            contextual(Function9::class) {
                Function9Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9])
            }
            contextual(Function10::class) {
                Function10Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10])
            }
            contextual(Function11::class) {
                Function11serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11])
            }
            contextual(Function12::class) {
                Function12Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11], it[12])
            }
            contextual(Function13::class) {
                Function13Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11], it[12], it[13])
            }
            contextual(Function14::class) {
                Function14Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11], it[12], it[13], it[14])
            }
            contextual(Function15::class) {
                Function15Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11], it[12], it[13], it[14], it[15])
            }
            contextual(Function16::class) {
                Function16Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11], it[12], it[13], it[14], it[15], it[16])
            }
            contextual(Function17::class) {
                Function17Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11], it[12], it[13], it[14], it[15], it[16], it[17])
            }
            contextual(Function18::class) {
                Function18Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11], it[12], it[13], it[14], it[15], it[16], it[17], it[18])
            }
            contextual(Function19::class) {
                Function19Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11], it[12], it[13], it[14], it[15], it[16], it[17], it[18], it[19])
            }
            contextual(Function20::class) {
                Function20Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11], it[12], it[13], it[14], it[15], it[16], it[17], it[18], it[19], it[20])
            }
            contextual(Function21::class) {
                Function21Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11], it[12], it[13], it[14], it[15], it[16], it[17], it[18], it[19], it[20], it[21])
            }
            contextual(Function22::class) {
                Function22Serializer(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9], it[10], it[11], it[12], it[13], it[14], it[15], it[16], it[17], it[18], it[19], it[20], it[21], it[22])
            }
        }
    }
}

public class KCallableSerializer<R>(returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<KCallable<R>>(returnTypeSerializer)
public class InvokableSerializer<R>(returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Invokable<R>>(returnTypeSerializer)
public class Function0Serializer<R>(returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function0<R>>(returnTypeSerializer)
public class Function1Serializer<R>(p1: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function1<*, R>>(returnTypeSerializer)
public class Function2Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function2<*, *, R>>(returnTypeSerializer)
public class Function3Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function3<*, *, *, R>>(returnTypeSerializer)
public class Function4Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function4<*, *, *, *, R>>(returnTypeSerializer)
public class Function5Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function5<*, *, *, *, *, R>>(returnTypeSerializer)
public class Function6Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function6<*, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function7Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function7<*, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function8Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function8<*, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function9Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function9<*, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function10Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function10<*, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function11serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function11<*, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function12Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, p12: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function12<*, *, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function13Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, p12: KSerializer<*>, p13: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function13<*, *, *, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function14Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, p12: KSerializer<*>, p13: KSerializer<*>, p14: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function14<*, *, *, *, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function15Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, p12: KSerializer<*>, p13: KSerializer<*>, p14: KSerializer<*>, p15: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function15<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function16Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, p12: KSerializer<*>, p13: KSerializer<*>, p14: KSerializer<*>, p15: KSerializer<*>, p16: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function16<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function17Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, p12: KSerializer<*>, p13: KSerializer<*>, p14: KSerializer<*>, p15: KSerializer<*>, p16: KSerializer<*>, p17: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function17<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function18Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, p12: KSerializer<*>, p13: KSerializer<*>, p14: KSerializer<*>, p15: KSerializer<*>, p16: KSerializer<*>, p17: KSerializer<*>, p18: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function18<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function19Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, p12: KSerializer<*>, p13: KSerializer<*>, p14: KSerializer<*>, p15: KSerializer<*>, p16: KSerializer<*>, p17: KSerializer<*>, p18: KSerializer<*>, p19: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function19<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function20Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, p12: KSerializer<*>, p13: KSerializer<*>, p14: KSerializer<*>, p15: KSerializer<*>, p16: KSerializer<*>, p17: KSerializer<*>, p18: KSerializer<*>, p19: KSerializer<*>, p20: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function20<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function21Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, p12: KSerializer<*>, p13: KSerializer<*>, p14: KSerializer<*>, p15: KSerializer<*>, p16: KSerializer<*>, p17: KSerializer<*>, p18: KSerializer<*>, p19: KSerializer<*>, p20: KSerializer<*>, p21: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function21<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
public class Function22Serializer<R>(p1: KSerializer<*>, p2: KSerializer<*>, p3: KSerializer<*>, p4: KSerializer<*>, p5: KSerializer<*>, p6: KSerializer<*>, p7: KSerializer<*>, p8: KSerializer<*>, p9: KSerializer<*>, p10: KSerializer<*>, p11: KSerializer<*>, p12: KSerializer<*>, p13: KSerializer<*>, p14: KSerializer<*>, p15: KSerializer<*>, p16: KSerializer<*>, p17: KSerializer<*>, p18: KSerializer<*>, p19: KSerializer<*>, p20: KSerializer<*>, p21: KSerializer<*>, p22: KSerializer<*>, returnTypeSerializer: KSerializer<R>) : FunctionLikeSerializer<Function22<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, R>>(returnTypeSerializer)
