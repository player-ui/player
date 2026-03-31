package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.PlayerRuntimeReleasedException
import com.intuit.playerui.hermes.bridge.runtime.Hermes
import com.intuit.playerui.plugins.assets.ReferenceAssetsPlugin
import com.intuit.playerui.plugins.types.CommonTypesPlugin
import com.intuit.playerui.utils.test.runBlockingTest
import com.intuit.playerui.utils.test.simpleFlowString
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.util.Collections
import java.util.concurrent.CountDownLatch
import kotlin.concurrent.thread

internal class HermesHeadlessPlayerStateRaceTest {
    @Test
    fun `state reads during release should not crash`() = runBlockingTest(timeout = 30000) {
        val runtime = Hermes.create()
        val player = HeadlessPlayer(
            runtime,
            ReferenceAssetsPlugin(),
            CommonTypesPlugin(),
        )

        // Use a real reference-assets flow to exercise deserialization.
        player.start(simpleFlowString)

        val errors = Collections.synchronizedList(mutableListOf<Throwable>())
        val startLatch = CountDownLatch(1)
        val readerCount = 8

        // Multiple concurrent readers to widen the race window.
        val readers = (1..readerCount).map { i ->
            thread(start = true, name = "state-reader-$i") {
                startLatch.await()
                repeat(200) {
                    try {
                        player.state
                    } catch (t: Throwable) {
                        errors.add(t)
                    }
                }
            }
        }

        val releaser = thread(start = true, name = "player-releaser") {
            startLatch.await()
            // Brief delay so readers are inside JSI calls before release fires.
            Thread.sleep(5)
            try {
                player.release()
            } catch (t: Throwable) {
                errors.add(t)
            }
        }

        // All threads start simultaneously.
        startLatch.countDown()

        readers.forEach { it.join() }
        releaser.join()

        // Any errors from racing with release should be PlayerRuntimeReleasedException, not raw NPEs.
        val unexpectedErrors = errors.filter { it !is PlayerRuntimeReleasedException }
        assertTrue(unexpectedErrors.isEmpty(), "Unexpected errors: ${unexpectedErrors.map { "${it::class.simpleName}: ${it.message}" }}")
    }
}
