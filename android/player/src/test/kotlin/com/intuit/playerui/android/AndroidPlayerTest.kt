package com.intuit.playerui.android

import android.util.Level
import android.util.clearLogs
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test

internal class AndroidPlayerTest {
    @AfterEach
    fun tearDown() = clearLogs()

    @Test
    fun `logs initialization time on startup`() = runBlocking {
        AndroidPlayer()

        assertLoggedMatching(Regex("""INFO: AndroidPlayer: AndroidPlayer initialized in \d+ ms\."""))
    }

    private suspend fun assertLoggedMatching(regex: Regex, timeout: Long = 5000) = try {
        withTimeout(timeout) {
            while (Level.Info.getLogs().none { regex.matches(it) }) {
                delay(50)
            }
        }
    } catch (exception: TimeoutCancellationException) {
        throw AssertionError("No info log matching $regex\nin ${Level.Info.getLogs()}")
    }
}
