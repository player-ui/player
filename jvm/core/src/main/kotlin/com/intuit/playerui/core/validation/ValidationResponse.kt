package com.intuit.playerui.core.validation

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.experimental.RuntimeClassDiscriminator
import com.intuit.playerui.core.validation.WarningValidationResponse.Serializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer

@Serializable
@RuntimeClassDiscriminator("severity")
public sealed class ValidationResponse : NodeWrapper {
    /** The validation message to show to the user */
    public val message: String by NodeSerializableField(String.serializer())

    /** List of parameters associated with a validation. */
    public val parameters: Map<String, Any?>? by NodeSerializableField(MapSerializer(String.serializer(), GenericSerializer()).nullable)
}

@Serializable(with = Serializer::class)
public class WarningValidationResponse(override val node: Node) : ValidationResponse() {
    private val dismiss: Invokable<Unit>? by NodeSerializableFunction()

    /** Warning validations can be dismissed without correcting the error */
    public fun dismiss() {
        dismiss?.invoke()
    }

    internal object Serializer : NodeWrapperSerializer<WarningValidationResponse>(::WarningValidationResponse, "warning")
}

@Serializable(with = ErrorValidationResponse.Serializer::class)
public class ErrorValidationResponse(override val node: Node) : ValidationResponse() {
    internal object Serializer : NodeWrapperSerializer<ErrorValidationResponse>(::ErrorValidationResponse, "error")
}
