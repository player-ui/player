package com.intuit.playerui.core.bridge

import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.player.PlayerException

/** Specific [PlayerException] that denotes an exception that occurred within the context of a [Runtime] */
public class PlayerRuntimeException(
    public val runtime: Runtime<*>,
    message: String,
    cause: Throwable? = null,
) : PlayerException("[$runtime] $message", cause)

public inline fun Runtime<*>.PlayerRuntimeException(message: String, cause: Throwable? = null): PlayerRuntimeException =
    PlayerRuntimeException(this, message, cause)
