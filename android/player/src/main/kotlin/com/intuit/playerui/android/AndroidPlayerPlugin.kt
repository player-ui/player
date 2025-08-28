package com.intuit.playerui.android

import com.intuit.playerui.core.plugins.Plugin

public interface AndroidPlayerPlugin : Plugin {
    public fun apply(androidPlayer: AndroidPlayer)
}
