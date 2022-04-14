package com.intuit.player.jvm.core.player

import com.intuit.player.jvm.core.plugins.JSPluginWrapper
import kotlinx.serialization.Serializable

/** Expected structure of JS object used to instantiate the core JS player */
@Serializable
public data class JSPlayerConfig(
    val plugins: List<JSPluginWrapper> = listOf(),
)
