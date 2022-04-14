package com.intuit.player.android

import com.intuit.player.jvm.core.plugins.Plugin

public interface AndroidPlayerPlugin : Plugin {
    public fun apply(androidPlayer: AndroidPlayer)
}
