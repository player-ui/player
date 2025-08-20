package com.intuit.playerui.core.bridge

import com.intuit.playerui.core.player.PlayerException

/** Specific [PlayerException] that denotes an exception that occurred within the context of a [Promise] */
public class PromiseException(
    message: String,
    cause: Throwable? = null,
) : PlayerException(message, cause)
