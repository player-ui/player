package com.intuit.playerui.android

import android.util.Level
import android.util.clearLogs
import com.intuit.playerui.android.utils.CoroutineTestDispatcherExtension
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.PlayerPlugin
import com.intuit.playerui.core.plugins.findPlugin
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith

@ExtendWith(CoroutineTestDispatcherExtension::class)
internal class AndroidPlayerTest {
    @AfterEach
    fun tearDown() = clearLogs()

    @Test
    fun `registerPlugin applies AndroidPlayerPlugin`() {
        var applied = false
        val plugin = object : AndroidPlayerPlugin {
            override fun apply(androidPlayer: AndroidPlayer) {
                applied = true
            }
        }

        val androidPlayer = AndroidPlayer()
        androidPlayer.registerPlugin(plugin)

        assertTrue(applied)
        assertTrue(androidPlayer.plugins.contains(plugin))
    }

    @Test
    fun `registerPlugin delegates non-Android plugin to HeadlessPlayer`() {
        var applied = false
        val plugin = object : PlayerPlugin {
            override fun apply(player: Player) {
                applied = true
            }
        }

        val androidPlayer = AndroidPlayer()
        androidPlayer.registerPlugin(plugin)

        assertTrue(applied)
        assertTrue(androidPlayer.plugins.contains(plugin))
        assertTrue(androidPlayer.player.plugins.contains(plugin))
    }

    @Test
    fun `findPlugin returns plugin registered after instantiation`() {
        class TrackingPlugin : AndroidPlayerPlugin {
            override fun apply(androidPlayer: AndroidPlayer) {}
        }

        val androidPlayer = AndroidPlayer()
        val plugin = TrackingPlugin()
        androidPlayer.registerPlugin(plugin)

        assertNotNull(androidPlayer.findPlugin<TrackingPlugin>())
    }

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
