package com.intuit.player.android.logger

import android.util.clearLogs
import android.util.d
import android.util.e
import android.util.i
import android.util.v
import android.util.w
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

internal class AndroidLoggerTest {
    companion object {
        const val defaultTag = "AndroidLogger"
        const val trace = "this is very verbose"
        const val debug = "this is useful for debugging"
        const val info = "this is informative"
        const val warn = "this is a warning"
        const val error = "this is an error"
    }

    @AfterEach
    fun tearDown() = clearLogs()

    @Test
    fun `test log methods`() {
        val logger = AndroidLogger()
        assertEquals(defaultTag, logger.name)
        logger.trace(trace)
        assertTrace()
        logger.debug(debug)
        assertDebug()
        logger.info(info)
        assertInfo()
        logger.warn(warn)
        assertWarn()
        logger.error(error)
        assertError()
    }

    @Test
    fun `test name configurability`() {
        val tag = "Logger"
        val logger = AndroidLogger(tag)
        assertEquals(tag, logger.name)
        logger.trace(trace)
        assertTrace(tag)
        logger.debug(debug)
        assertDebug(tag)
        logger.info(info)
        assertInfo(tag)
        logger.warn(warn)
        assertWarn(tag)
        logger.error(error)
        assertError(tag)
    }

    private fun assertTrace(tag: String = defaultTag, msg: String = trace) =
        v.assertLogged("TRACE", tag, msg)

    private fun assertDebug(tag: String = defaultTag, msg: String = debug) =
        d.assertLogged("DEBUG", tag, msg)
    private fun assertInfo(tag: String = defaultTag, msg: String = info) =
        i.assertLogged("INFO", tag, msg)
    private fun assertWarn(tag: String = defaultTag, msg: String = warn) =
        w.assertLogged("WARN", tag, msg)
    private fun assertError(tag: String = defaultTag, msg: String = error) =
        e.assertLogged("ERROR", tag, msg)

    private fun List<String>.assertLogged(level: String, tag: String, msg: String) =
        assertTrue(this.contains("$level: $tag: $msg"))
}
