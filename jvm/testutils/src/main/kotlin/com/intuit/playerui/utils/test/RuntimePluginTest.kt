package com.intuit.playerui.utils.test

import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.plugins.RuntimePlugin
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestTemplate

/**
 * Extension of [RuntimeTest] which provides some structure for building and applying a [RuntimePlugin]. As denoted
 * in the [RuntimeTest] docs, [TestTemplate]s will be executed for each [Runtime] on the classpath, while normal
 * [Test]s will just be executed once.
 */
public abstract class RuntimePluginTest<Plugin : RuntimePlugin> : RuntimeTest() {
    protected lateinit var plugin: Plugin private set

    @BeforeEach
    protected fun setupPlugin() {
        setupPlugin(buildPlugin())
    }

    /** Configure the provided [plugin] to be used for the upcoming test */
    protected fun setupPlugin(plugin: Plugin) {
        this.plugin = plugin
        plugin.apply(runtime)
    }

    /** Method called during test setup to build the default version of the [plugin] */
    protected abstract fun buildPlugin(): Plugin
}
