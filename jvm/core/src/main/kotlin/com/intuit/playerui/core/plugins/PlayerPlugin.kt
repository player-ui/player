package com.intuit.playerui.core.plugins

import com.intuit.playerui.core.player.Player

/** JVM [Player] plugin that enables additional player configuration on the JVM */
public interface PlayerPlugin : Plugin {
    /** Invoked with the [Player] instance to configure */
    public fun apply(player: Player)
}
