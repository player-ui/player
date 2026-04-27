package com.intuit.playerui.core.player

import com.intuit.playerui.core.error.ErrorSeverity

public interface PlayerExceptionMetadata {
    public val type: String
    public val severity: ErrorSeverity?
    public val metadata: Map<String, Any?>?
}
