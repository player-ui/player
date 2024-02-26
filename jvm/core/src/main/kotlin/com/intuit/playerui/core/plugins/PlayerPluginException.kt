package com.intuit.playerui.core.plugins

import com.intuit.playerui.core.player.PlayerException

public class PlayerPluginException(public val pluginName: String, message: String, cause: Throwable? = null) : PlayerException("[$pluginName] $message", cause)
