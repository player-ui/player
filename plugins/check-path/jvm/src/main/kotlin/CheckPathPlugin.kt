package com.intuit.player.plugins.checkpath

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.player.Player
import com.intuit.player.jvm.core.plugins.JSScriptPluginWrapper
import com.intuit.player.jvm.core.plugins.findPlugin

/** Reduced wrapper of the core check-path plugin for relative asset querying */
public class CheckPathPlugin : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath) {

    /** Get the [Asset] represented by the [id] */
    public fun getAsset(id: String): Asset? = instance.getInvokable<Any?>("getAsset")?.invoke(id) as? Asset

    private companion object {
        private const val bundledSourcePath = "plugins/check-path/core/dist/check-path-plugin.prod.js"
        private const val pluginName = "CheckPathPlugin.CheckPathPlugin"
    }
}

/** Convenience getter to find the first [CheckPathPlugin] registered to the [Player] */
public val Player.checkPathPlugin: CheckPathPlugin? get() = findPlugin()

public fun Player.getAsset(id: String): Asset? = checkPathPlugin?.getAsset(id)
