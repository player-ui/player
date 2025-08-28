package com.intuit.playerui.android.logger

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
        const val DEFAULT_TAG = "AndroidLogger"
        const val TRACE = "this is very verbose"
        const val DEBUG = "this is useful for debugging"
        const val INFO = "this is informative"
        const val WARN = "this is a warning"
        const val ERROR = "this is an error"
    }

    @AfterEach
    fun tearDown() = clearLogs()

    @Test
    fun `test log methods`() {
        val logger = AndroidLogger()
        assertEquals(DEFAULT_TAG, logger.name)
        logger.trace(TRACE)
        assertTrace()
        logger.debug(DEBUG)
        assertDebug()
        logger.info(INFO)
        assertInfo()
        logger.warn(WARN)
        assertWarn()
        logger.error(ERROR)
        assertError()
    }

    @Test
    fun `test name configurability`() {
        val tag = "Logger"
        val logger = AndroidLogger(tag)
        assertEquals(tag, logger.name)
        logger.trace(TRACE)
        assertTrace(tag)
        logger.debug(DEBUG)
        assertDebug(tag)
        logger.info(INFO)
        assertInfo(tag)
        logger.warn(WARN)
        assertWarn(tag)
        logger.error(ERROR)
        assertError(tag)
    }

    private fun assertTrace(tag: String = DEFAULT_TAG, msg: String = TRACE) = v.assertLogged("TRACE", tag, msg)

    private fun assertDebug(tag: String = DEFAULT_TAG, msg: String = DEBUG) = d.assertLogged("DEBUG", tag, msg)

    private fun assertInfo(tag: String = DEFAULT_TAG, msg: String = INFO) = i.assertLogged("INFO", tag, msg)

    private fun assertWarn(tag: String = DEFAULT_TAG, msg: String = WARN) = w.assertLogged("WARN", tag, msg)

    private fun assertError(tag: String = DEFAULT_TAG, msg: String = ERROR) = e.assertLogged("ERROR", tag, msg)

    private fun List<String>.assertLogged(
        level: String,
        tag: String,
        msg: String,
    ) = assertTrue(this.contains("$level: $tag: $msg"))
}
