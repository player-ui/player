package com.intuit.playerui.plugins.checkpath

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.findPlugin

/** Reduced wrapper of the core check-path plugin for relative asset querying */
public class CheckPathPlugin : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath) {

    /** Get the [Asset] represented by the [id] */
    public fun getAsset(id: String): Asset? = instance.getInvokable<Any?>("getAsset")?.invoke(id) as? Asset

    private companion object {
        private const val bundledSourcePath = "plugins/check-path/core/dist/CheckPathPlugin.native.js"
        private const val pluginName = "CheckPathPlugin.CheckPathPlugin"
    }
}

/** Convenience getter to find the first [CheckPathPlugin] registered to the [Player] */
public val Player.checkPathPlugin: CheckPathPlugin? get() = findPlugin()

public fun Player.getAsset(id: String): Asset? = checkPathPlugin?.getAsset(id)
