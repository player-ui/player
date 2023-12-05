package com.intuit.player.jvm.core.plugins

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

internal class PluggableTest {

    object IncludedPlugin : Plugin

    object NotIncludedPlugin : Plugin

    val pluggable = object : Pluggable {
        override val plugins = listOf(IncludedPlugin)
    }

    @Test fun `findPlugin finds a plugin`() {
        assertEquals(IncludedPlugin, pluggable.findPlugin<IncludedPlugin>())
    }

    @Test fun `findPlugin returns null if plugin not found`() {
        assertNull(pluggable.findPlugin<NotIncludedPlugin>())
    }

    @Test fun `findPlugin logs if plugin not found`() {
        var didWarn = false
        val pluggable = object : Pluggable {
            override val plugins = listOf(
                IncludedPlugin,
                object : LoggerPlugin {
                    override fun trace(vararg args: Any?) = throw UnsupportedOperationException()
                    override fun debug(vararg args: Any?) = throw UnsupportedOperationException()
                    override fun info(vararg args: Any?) = throw UnsupportedOperationException()
                    override fun warn(vararg args: Any?) {
                        assertEquals("NotIncludedPlugin not found", args.first())
                        didWarn = true
                    }
                    override fun error(vararg args: Any?) = throw UnsupportedOperationException()
                },
            )
        }

        pluggable.findPlugin<NotIncludedPlugin>()
        assertTrue(didWarn)
    }
}
