package com.intuit.player.jvm.core.bridge

import com.intuit.player.jvm.core.player.PlayerException

/** Specific [PlayerException] that denotes an exception that occurred within the context of a [Promise] */
public class PromiseException(message: String, cause: Throwable? = null) : PlayerException(message, cause)
