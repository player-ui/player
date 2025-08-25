package com.intuit.playerui.utils.test

import com.intuit.playerui.core.player.PlayerException

/** Exception denoting an issue during [PlayerTest] setup or teardown */
public class PlayerTestException(
    message: String,
    cause: Throwable? = null,
) : PlayerException(message, cause)
