package com.intuit.player.jvm.core.validation

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.deserialize
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.bridge.serialization.serializers.PolymorphicNodeWrapperSerializer
import com.intuit.player.jvm.core.player.PlayerException
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable

@Serializable(with = ValidationResponseSerializer::class)
public sealed class ValidationResponse : NodeWrapper {
    /** The validation message to show to the user */
    public val message: String get() = node.getString("message")!!

    /** List of parameters associated with a validation. */
    public val parameters: Map<String, Any?>? get() = node.getObject("parameters")?.deserialize()
}

@Serializable(with = WarningValidationResponse.Serializer::class)
public class WarningValidationResponse(override val node: Node) : ValidationResponse() {

    /** Warning validations can be dismissed without correcting the error */
    public fun dismiss() {
        node.getFunction<Unit>("dismiss")?.invoke()
    }

    internal object Serializer : NodeWrapperSerializer<WarningValidationResponse>(::WarningValidationResponse)
}

@Serializable(with = ErrorValidationResponse.Serializer::class)
public class ErrorValidationResponse(override val node: Node) : ValidationResponse() {
    internal object Serializer : NodeWrapperSerializer<ErrorValidationResponse>(::ErrorValidationResponse)
}

internal class ValidationResponseSerializer : PolymorphicNodeWrapperSerializer<ValidationResponse>() {
    override fun selectDeserializer(node: Node): KSerializer<out ValidationResponse> {
        return when (node.getString("severity")) {
            "warning" -> WarningValidationResponse.serializer()
            "error" -> ErrorValidationResponse.serializer()
            else -> throw PlayerException("ValidationResponse must be Error or Warning")
        }
    }
}
