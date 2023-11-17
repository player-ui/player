package com.intuit.player.jvm.core.validation

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.bridge.serialization.serializers.PolymorphicNodeWrapperSerializer
import com.intuit.player.jvm.core.player.PlayerException
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer

@Serializable(with = ValidationResponseSerializer::class)
public sealed class ValidationResponse : NodeWrapper {
    /** The validation message to show to the user */
    public val message: String by NodeSerializableField(String.serializer())

    /** List of parameters associated with a validation. */
    public val parameters: Map<String, Any?>? by NodeSerializableField(MapSerializer(String.serializer(), GenericSerializer()).nullable)
}

@Serializable(with = WarningValidationResponse.Serializer::class)
public class WarningValidationResponse(override val node: Node) : ValidationResponse() {

    /** Warning validations can be dismissed without correcting the error */
    public fun dismiss() {
        node.getInvokable<Unit>("dismiss")?.invoke()
    }

    internal object Serializer : NodeWrapperSerializer<WarningValidationResponse>(::WarningValidationResponse)
}

@Serializable(with = ErrorValidationResponse.Serializer::class)
public class ErrorValidationResponse(override val node: Node) : ValidationResponse() {
    internal object Serializer : NodeWrapperSerializer<ErrorValidationResponse>(::ErrorValidationResponse)
}

// TODO: Replace with local class discriminator
internal class ValidationResponseSerializer : PolymorphicNodeWrapperSerializer<ValidationResponse>() {
    override fun selectDeserializer(node: Node): KSerializer<out ValidationResponse> {
        return when (node.getString("severity")) {
            "warning" -> WarningValidationResponse.serializer()
            "error" -> ErrorValidationResponse.serializer()
            else -> throw PlayerException("ValidationResponse must be Error or Warning")
        }
    }
}
