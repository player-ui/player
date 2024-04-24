package com.intuit.playerui.core.flow

import com.intuit.playerui.core.player.PlayerException

/** Specific [PlayerException] that denotes an exception that occurred within the context of a flow */
public class FlowException internal constructor(reason: String) : PlayerException(reason)
