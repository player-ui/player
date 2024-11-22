package com.intuit.playerui.plugins.consolelogger

import com.intuit.playerui.utils.test.RuntimeTest
import com.intuit.playerui.utils.test.runBlockingTest
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.TestTemplate

internal class ConsoleLoggerPluginTest : RuntimeTest() {

    @TestTemplate fun `works as intended`() = runBlockingTest {
        val exceptions = mutableListOf<Throwable>()
        ConsoleLoggerPlugin(null, true).apply(runtime)
        Assertions.assertNotNull(runtime["console"])


    }
}

