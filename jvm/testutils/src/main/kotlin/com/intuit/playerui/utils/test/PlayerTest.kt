package com.intuit.playerui.utils.test

import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.player.HeadlessPlayer
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.LoggerPlugin
import com.intuit.playerui.core.plugins.Pluggable
import com.intuit.playerui.core.plugins.Plugin
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestTemplate

/**
 * Integration testing base class for testing functionality within a [HeadlessPlayer]. As denoted in the
 * [RuntimeTest] docs, [TestTemplate]s will be executed for each [Runtime] on the classpath, while normal
 * [Test]s will just be executed once.
 */
public abstract class PlayerTest :
    RuntimeTest(),
    Pluggable,
    LoggerPlugin by TestLogger {
    public lateinit var player: Player

    override val plugins: List<Plugin> get() = emptyList()

    @BeforeEach
    public fun setupPlayer() {
        setupPlayer(plugins + this, runtime)
    }

    /** Helper method for setting a [player] with configurable [plugins] and [runtime] */
    public fun setupPlayer(plugins: List<Plugin> = this.plugins + this, runtime: Runtime<*> = this.runtime) {
        player = HeadlessPlayer(plugins, runtime, config = runtime.config)
    }
}

public fun PlayerTest.setupPlayer(vararg plugins: Plugin, runtime: Runtime<*> = this.runtime) {
    setupPlayer(plugins.toList(), runtime)
}
