package com.intuit.player.jvm.core.plugins

import com.intuit.player.jvm.core.player.PlayerException

public class PlayerPluginException(public val pluginName: String, message: String, cause: Throwable? = null) : PlayerException("[$pluginName] $message", cause)
