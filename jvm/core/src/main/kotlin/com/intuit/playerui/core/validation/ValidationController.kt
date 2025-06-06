package com.intuit.playerui.core.validation

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.validation.ValidationController.Serializer
import kotlinx.serialization.Serializable

/** Limited definition of the player validationController to enable validating the current view */
@Serializable(with = Serializer::class)
public class ValidationController internal constructor(override val node: Node) : NodeWrapper {
    private val validateView: Invokable<ValidationInfo> by NodeSerializableFunction()

    /** Get information on whether transition is allowed along with potential blocking validations */
    public fun validateView(): ValidationInfo = validateView.invoke()

    internal object Serializer : NodeWrapperSerializer<ValidationController>(::ValidationController)
}
