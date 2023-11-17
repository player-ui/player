package com.intuit.player.jvm.core.bridge.serialization.serializers

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.encoding.NodeDecoder
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeSerializationException
import com.intuit.player.jvm.core.bridge.serialization.json.value
import com.intuit.player.jvm.core.utils.InternalPlayerApi
import kotlinx.serialization.InternalSerializationApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.builtins.ArraySerializer
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.serializerOrNull

/**
 * Generic serializer for [Any]? that uses the actual value type to determine the [KSerializer]
 * to use. Should be overridden by each [RuntimeFormat] to provide better contextual serialization
 * for runtime objects. This will be registered as the [Contextual] serializer for [Any] type
 * and will be used as a last resort to determine how to [serialize] the value. [deserialize]
 * provides limited support for the [NodeDecoder] and [JsonDecoder], as they both provide back-door
 * methods for decoding unknown structures.
 */
@InternalPlayerApi
public open class GenericSerializer(private val typeSerializers: List<KSerializer<*>>? = null) : KSerializer<Any?> {

    public fun <T> conform(): KSerializer<T> = this as KSerializer<T>

    // This needs to be a [PrimitiveKind] descriptor to ensure that existing formats [Json] doesn't mind using this
    // serializer for key-based values. Otherwise, it might complain about using structured keys, even if the key value
    // ends up being a primitive kind.
    // override val descriptor: SerialDescriptor by ContextualSerializer(Any::class)::descriptor
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("kotlin.Any?", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder): Any? = when (decoder) {
        is NodeDecoder -> decoder.decodeValue()
        is JsonDecoder -> when (val json = decoder.decodeJsonElement()) {
            is JsonPrimitive -> json.value
            is JsonArray -> Json.decodeFromJsonElement(ListSerializer(this), json)
            is JsonObject -> Json.decodeFromJsonElement(MapSerializer(this, this), json)
        }
        else -> throw RuntimeSerializationException(
            """
            |GenericFallbackSerializer provides limited deserialization support only for NodeDecoder and JsonDecoder:
            |   ${decoder::class} type not supported
            """.trimMargin(),
        )
    }

    /** Will attempt to find a registered serializer on the companion for whatever class the [value] */
    @OptIn(InternalSerializationApi::class)
    override fun serialize(encoder: Encoder, value: Any?): Unit = when (value) {
        null -> encoder.encodeNull()
        else -> encoder.encodeSerializableValue(
            value::class.serializerOrNull() as? KSerializer<Any?>
                ?: encoder.serializersModule.getContextual(
                    value::class,
                    // use the [typeSerializers] provided or just map to a collection of [GenericFallbackSerializer]s
                    typeSerializers ?: value::class.typeParameters.map { this },
                ) as? KSerializer<Any?>
                ?: encoder.serializersModule.getPolymorphic(Any::class, value)
                ?: generateSerializer(value),
            value,
        )
    }

    // this is a back-door that I'd like to be able to use the polymorphic default
    // construct for, but that only supports deserialization strategies
    protected open fun <T> generateSerializer(value: T): KSerializer<Any?> = when (value) {
        is NodeWrapper -> NodeWrapperSerializer { throw UnsupportedOperationException("cannot deserialize with an adhoc NodeSerializer") }
        is Node -> NodeSerializer()
        is List<*> -> ListSerializer(this)
        is Array<*> -> ArraySerializer(this)
        is Map<*, *> -> MapSerializer(this, this)
        is Throwable -> ThrowableSerializer()
        else -> throw SerializationException("could not deduce serializer for value: ($value) of type: (${value?.let { it::class }})")
    } as KSerializer<Any?>
}
