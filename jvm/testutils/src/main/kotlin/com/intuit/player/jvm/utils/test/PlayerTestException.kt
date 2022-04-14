package com.intuit.player.jvm.utils.test

import com.intuit.player.jvm.core.player.PlayerException

/** Exception denoting an issue during [PlayerTest] setup or teardown */
public class PlayerTestException(message: String, cause: Throwable? = null) : PlayerException(message, cause)
