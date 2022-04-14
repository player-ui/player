package com.intuit.player.jvm.core.expressions

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.descriptors.*
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

/**
 * Utility union type that allows for methods to easily accept
 * a [Single] or a [Collection] of expressions. The
 * custom [Serializer] automatically serializes to and from
 * the potential [Expression]s.
 */
@Serializable(with = Expression.Serializer::class)
public sealed class Expression {

    @Serializable(with = Single.Serializer::class)
    public data class Single(val expression: String) : Expression() {

        internal object Serializer : KSerializer<Single> {
            private val serializer: KSerializer<String> =
                String.serializer()

            override val descriptor = PrimitiveSerialDescriptor(
                Single::class.toString(),
                PrimitiveKind.STRING
            )

            override fun serialize(encoder: Encoder, value: Single) =
                serializer.serialize(encoder, value.expression)

            override fun deserialize(decoder: Decoder) =
                Single(serializer.deserialize(decoder))
        }
    }

    @Serializable(with = Collection.Serializer::class)
    public data class Collection(val expressions: List<String>) : Expression() {

        public constructor(vararg expressions: String) : this(expressions.toList())

        internal object Serializer : KSerializer<Collection> {
            private val serializer: KSerializer<List<String>> =
                ListSerializer(String.serializer())

            override val descriptor = listSerialDescriptor<String>()

            override fun serialize(encoder: Encoder, value: Collection) =
                serializer.serialize(encoder, value.expressions)

            override fun deserialize(decoder: Decoder) =
                Collection(serializer.deserialize(decoder))
        }
    }

    internal object Serializer : KSerializer<Expression> {

        /**
         * This is a really problematic [descriptor]. It really
         * should not be a [PrimitiveKind.STRING], rather a [PolymorphicKind.SEALED].
         * However, when using the [PolymorphicKind.SEALED] kind,
         * assumptions are made regarding the underlying structure.
         * Since the [Single] class is serialized as a primitive,
         * those assumptions cause the serialization attempt to
         * blow up. By using [PrimitiveKind], the output it wrapped
         * in a [kotlinx.serialization.json.internal.JsonPrimitiveOutput],
         * which surprisingly uses a [kotlinx.serialization.json.JsonElement]
         * as the backing data type. This allows any form of Json
         * to be returned even though, the [descriptor] says it
         * is a [PrimitiveKind].
         */
        override val descriptor = PrimitiveSerialDescriptor(
            Single::class.toString(),
            PrimitiveKind.STRING
        )

        override fun serialize(encoder: Encoder, value: Expression) = when (value) {
            is Single -> Single.Serializer.serialize(encoder, value)
            is Collection -> Collection.Serializer.serialize(encoder, value)
        }

        override fun deserialize(decoder: Decoder) = try {
            Single(decoder.decodeString())
        } catch (e: Exception) {
            Collection.Serializer.deserialize(decoder)
        }
    }
}
