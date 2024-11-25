package com.intuit.playerui.plugins.consolelogger

import com.intuit.playerui.core.plugins.LoggerPlugin
import com.intuit.playerui.utils.test.RuntimeTest
import com.intuit.playerui.utils.test.runBlockingTest
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.verify
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.extension.ExtendWith

@ExtendWith(MockKExtension::class)
internal class ConsoleLoggerPluginTest : RuntimeTest() {

    @MockK(relaxed = true) lateinit var logger: LoggerPlugin
    @MockK lateinit var mockFunction: (Array<Any>?) -> Unit

    @BeforeEach
    fun setup() {
        every { logger.debug(*anyVararg()) } answers {}
    }

    @TestTemplate fun `log works as intended`() = runBlockingTest {
        ConsoleLoggerPlugin(logger, true).apply(runtime)
        Assertions.assertNotNull(runtime["console"])

        runtime.execute("console.log('Hello world')")
        verify(exactly = 1) { logger.debug(arrayOf("Hello world")) }
    }

    @TestTemplate fun `debug works as intended`() = runBlockingTest {
        ConsoleLoggerPlugin(logger, true).apply(runtime)
        Assertions.assertNotNull(runtime["console"])

        runtime.execute("console.debug('Hello world')")
        verify(exactly = 1) { logger.debug(arrayOf("Hello world")) }
    }

    @TestTemplate fun `info works as intended`() = runBlockingTest {
        ConsoleLoggerPlugin(logger, true).apply(runtime)
        Assertions.assertNotNull(runtime["console"])

        runtime.execute("console.info('Hello world')")
        verify(exactly = 1) { logger.info(arrayOf("Hello world")) }
    }

    @TestTemplate fun `warning works as intended`() = runBlockingTest {
        ConsoleLoggerPlugin(logger, true).apply(runtime)
        Assertions.assertNotNull(runtime["console"])

        runtime.execute("console.warn('Hello world')")
        verify(exactly = 1) { logger.warn(arrayOf("Hello world")) }
    }

    @TestTemplate fun `error works as intended`() = runBlockingTest {
        ConsoleLoggerPlugin(logger, true).apply(runtime)
        Assertions.assertNotNull(runtime["console"])

        runtime.execute("console.error('Hello world')")
        verify(exactly = 1) { logger.error(arrayOf("Hello world")) }
    }

    @TestTemplate fun `trace works as intended`() = runBlockingTest {
        ConsoleLoggerPlugin(logger, true).apply(runtime)
        Assertions.assertNotNull(runtime["console"])

        runtime.execute("console.trace('Hello world')")
        verify(exactly = 1) { logger.trace(arrayOf("Hello world")) }
    }
}

