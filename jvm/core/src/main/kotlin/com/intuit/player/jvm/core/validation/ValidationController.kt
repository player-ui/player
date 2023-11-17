package com.intuit.player.jvm.core.validation

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.deserialize
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.data.get
import com.intuit.player.jvm.core.data.set
import kotlinx.serialization.Serializable

/** Limited definition of the player validationController to enable validating the current view */
@Serializable(with = ValidationController.Serializer::class)
public class ValidationController internal constructor(override val node: Node) : NodeWrapper {

    /** Get information on whether transition is allowed along with potential blocking validations */
    public fun validateView(): ValidationInfo =
        node.getInvokable<Node>("validateView")!!.invoke().deserialize()

    internal object Serializer : NodeWrapperSerializer<ValidationController>(::ValidationController)
}
