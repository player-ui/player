package com.intuit.playerui.plugins.context

import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.findPlugin

/**
 * JVM wrapper around the JS `StateContextPlugin`. Registering it mirrors
 * Player runtime state into the [ContextPlugin] store and publishes the
 * aggregated `player.state` entry, which can be read as a typed
 * [PlayerStateContext]:
 *
 * ```
 * player.contextPlugin?.get<PlayerStateContext>("player.state")?.flow?.transition?.invoke("Next")
 * ```
 *
 * Auto-registers a [ContextPlugin] on the JS side if one isn't already present.
 */
public class StateContextPlugin : JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH) {
    private companion object {
        private const val PLUGIN_NAME = "ContextPlugin.StateContextPlugin"
        private const val BUNDLED_SOURCE_PATH = "plugins/context/core/dist/ContextPlugin.native.js"
    }
}

/** Convenience getter to find the first [StateContextPlugin] registered to the [Player]. */
public val Player.stateContextPlugin: StateContextPlugin? get() = findPlugin()
