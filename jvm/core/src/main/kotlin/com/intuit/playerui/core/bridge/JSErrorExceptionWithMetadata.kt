package com.intuit.playerui.core.bridge

import com.intuit.playerui.core.bridge.serialization.serializers.ThrowableSerializer
import com.intuit.playerui.core.error.ErrorSeverity
import com.intuit.playerui.core.player.PlayerExceptionMetadata
import kotlinx.serialization.builtins.ListSerializer

public class JSErrorExceptionWithMetadata(
    node: Node,
    cause: Throwable? = node.getSerializable("innerErrors", ListSerializer(ThrowableSerializer()))?.first(),
    override val type: String,
    override val severity: ErrorSeverity? = null,
    override val metadata: Map<String, Any?>? = null,
) : JSErrorException(node, cause),
    NodeWrapper,
    PlayerExceptionMetadata
