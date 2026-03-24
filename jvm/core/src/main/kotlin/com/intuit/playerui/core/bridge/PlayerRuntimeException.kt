package com.intuit.playerui.core.bridge

import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.utils.InternalPlayerApi

/** Specific [PlayerException] that denotes an exception that occurred within the context of a [Runtime] */
public open class PlayerRuntimeException
    @InternalPlayerApi
    constructor(
        public val runtime: Runtime<*>,
        message: String,
        cause: Throwable? = null,
    ) : PlayerException("[$runtime] $message", cause)

public inline fun Runtime<*>.PlayerRuntimeException(message: String, cause: Throwable? = null): PlayerRuntimeException =
    PlayerRuntimeException(this, message, cause)

public class PlayerRuntimeReleasedException private constructor(
    runtime: Runtime<*>,
) : PlayerRuntimeException(runtime, "Runtime object has been released!") {
    public companion object {
        @InternalPlayerApi public fun Runtime<*>.ensureNotReleased(): Nothing? {
            if (runtime.isReleased()) throw PlayerRuntimeReleasedException(this)
        }
    }
}
