package com.intuit.playerui.core.bridge

import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.ThrowableSerializer
import com.intuit.playerui.core.error.ErrorSeverity
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.PlayerExceptionMetadata
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer

public class JSErrorException(
    override val node: Node,
    cause: Throwable? = node.getSerializable("innerErrors", ListSerializer(ThrowableSerializer()))?.first(),
    override val type: String = "",
    override val severity: ErrorSeverity?,
    override val metadata: Map<String, Any?>?,
) : PlayerException(node.getString("message") ?: "", cause),
    NodeWrapper,
    PlayerExceptionMetadata {
    public val name: String by NodeSerializableField(String.serializer()) {
        "Error"
    }

    override val message: String = "$name: ${super.message}"
}
