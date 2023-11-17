package com.intuit.player.jvm.core.bridge.serialization.serializers

import com.intuit.player.jvm.core.bridge.JSErrorException
import com.intuit.player.jvm.core.bridge.serialization.encoding.requireNodeDecoder
import com.intuit.player.jvm.core.bridge.serialization.encoding.requireNodeEncoder
import com.intuit.player.jvm.core.player.PlayerException
import com.intuit.player.jvm.core.utils.InternalPlayerApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.Serializer
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.descriptors.nullable
import kotlinx.serialization.encoding.CompositeDecoder
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.encoding.decodeStructure
import kotlinx.serialization.encoding.encodeStructure

// the serializer knows _how_ to construct the `Throwable` type from a JS Node
// and _how_ to deconstruct a `Throwable` into primitives to serialize
@Serializer(forClass = Throwable::class)
public class ThrowableSerializer : KSerializer<Throwable> {

    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("kotlin.Throwable") {
        element("serialized", Boolean.serializer().descriptor.nullable, isOptional = true)
        element("message", String.serializer().descriptor.nullable, isOptional = true)
        element("stack", String.serializer().descriptor.nullable, isOptional = true)
        element("stackTrace", serializedStackTraceSerializer.descriptor.nullable, isOptional = true)
        element("cause", defer { ThrowableSerializer().descriptor.nullable }, isOptional = true)
    }

    override fun deserialize(decoder: Decoder): PlayerException = decoder.decodeStructure(descriptor) {
        var serialized = false
        var message = ""
        var stackTrace: Array<StackTraceElement> = emptyArray()
        var cause: Throwable? = null

        fun decodeStackTraceFromStack(stack: String? = decodeNullableSerializableElement(descriptor, 2, String.serializer().nullable)): Array<StackTraceElement> = stack
            ?.split("\n")
            ?.mapNotNull(errorStackReg::find)
            ?.map(MatchResult::destructured)
            ?.map { (className, methodName, fileName, lineNumber) ->
                StackTraceElement(className, methodName, fileName, lineNumber.toIntOrNull() ?: -2)
            }?.toTypedArray() ?: emptyArray()

        fun decodeSerializedStackTrace(): Array<StackTraceElement> = decodeNullableSerializableElement(descriptor, 3, serializedStackTraceSerializer.nullable)
            ?.map { (className, methodName, fileName, lineNumber) ->
                StackTraceElement(className, methodName, fileName, lineNumber)
            }?.toTypedArray() ?: emptyArray()

        if (decodeSequentially()) {
            serialized = decodeNullableSerializableElement(descriptor, 0, Boolean.serializer().nullable) ?: false

            if (serialized) {
                message = decodeNullableSerializableElement(descriptor, 1, String.serializer().nullable) ?: ""
                stackTrace = decodeSerializedStackTrace()
                cause = decodeNullableSerializableElement(descriptor, 4, nullable)
            } else {
                stackTrace = decodeStackTraceFromStack()
            }
        } else {
            while (true) {
                when (val index = decodeElementIndex(descriptor)) {
                    0 -> serialized = decodeNullableSerializableElement(descriptor, 0, Boolean.serializer().nullable) ?: false
                    1 -> message = decodeNullableSerializableElement(descriptor, 1, String.serializer().nullable) ?: ""
                    2 -> stackTrace = decodeStackTraceFromStack()
                    3 -> stackTrace = decodeSerializedStackTrace()
                    4 -> cause = decodeNullableSerializableElement(descriptor, 4, nullable)
                    CompositeDecoder.DECODE_DONE -> break
                    else -> error("Unexpected index: $index")
                }
            }
        }

        if (serialized) {
            PlayerException(message, cause)
        } else {
            val error = decoder.requireNodeDecoder().decodeNode()
            stackTrace = decodeStackTraceFromStack(error.getString("stack"))
            JSErrorException(error)
        }.apply { setStackTrace(stackTrace) }
    }

    override fun serialize(encoder: Encoder, value: Throwable) {
        when (value) {
            is JSErrorException -> encoder.requireNodeEncoder().encodeNode(value.node)
            else -> encoder.encodeStructure(descriptor) {
                encodeBooleanElement(descriptor, 0, true)
                encodeNullableSerializableElement(descriptor, 1, String.serializer(), value.message)
                encodeStringElement(descriptor, 2, value.stackTraceToString())
                encodeSerializableElement(
                    descriptor,
                    3,
                    serializedStackTraceSerializer,
                    value.stackTrace.map { stackTraceElement: StackTraceElement ->
                        SerializableStackTraceElement(
                            stackTraceElement.className,
                            stackTraceElement.methodName,
                            stackTraceElement.fileName,
                            stackTraceElement.lineNumber,
                        )
                    },
                )
                encodeNullableSerializableElement(descriptor, 4, nullable, value.cause)
            }
        }
    }

    @InternalPlayerApi
    @Serializable
    public data class SerializableStackTraceElement(
        val className: String?,
        val methodName: String?,
        val fileName: String?,
        val lineNumber: Int,
    )

    public companion object {
        private val errorStackReg: Regex =
            """(?<=at )(?<class>[A-z\d\s.<>$]*(?=\.))?\.?(?<method>[A-z\d\s.<>$]*(?= ))? ?\(?(?:.*, )?(?<file>[A-z\d\s.<>$]*)?:?(?<line>[A-z\d\s.<>$]*)?:?(?<column>[A-z\d\s.<>$]*)?\)?$""".toRegex(
                RegexOption.MULTILINE,
            )

        private val serializedStackTraceSerializer = ListSerializer(SerializableStackTraceElement.serializer())
    }
}
