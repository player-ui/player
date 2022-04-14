package com.intuit.player.jvm.core.plugins

import com.intuit.player.jvm.core.player.Player

/** JVM [Player] plugin that enables additional player configuration on the JVM */
public interface PlayerPlugin : Plugin {

    /** Invoked with the [Player] instance to configure */
    public fun apply(player: Player)
}
