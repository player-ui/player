package com.intuit.playerui.core.player

import com.intuit.playerui.core.error.ErrorSeverity

public class PlayerExceptionWithMetadata(
    message: String,
    override val type: String,
    override val severity: ErrorSeverity? = null,
    override val metadata: Map<String, Any?>? = null,
    cause: Throwable? = null,
) : PlayerException(message, cause),
    PlayerExceptionMetadata
