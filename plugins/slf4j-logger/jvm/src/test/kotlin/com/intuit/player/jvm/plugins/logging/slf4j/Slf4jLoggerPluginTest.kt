package com.intuit.player.jvm.plugins.logging.slf4j

import com.intuit.player.jvm.core.plugins.logging.loggers
import com.intuit.player.jvm.utils.test.RuntimeTest
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class Slf4jLoggerPluginTest : RuntimeTest() {

    @Test
    fun `test default name`() {
        Assertions.assertEquals("Slf4jLogger", Slf4jLoggerFactory.create().config.name)
    }

    @Test
    fun `test logger can be customized`() {
        Assertions.assertEquals(
            "MyLogger",
            Slf4jLoggerFactory.create {
                name = "MyLogger"
            }.logger.name
        )
    }

    @Test
    fun `can be loaded by service loader`() {
        Assertions.assertTrue(loggers.size == 1)
        Assertions.assertTrue(loggers.first() is Slf4jLoggerPlugin)
    }
}
