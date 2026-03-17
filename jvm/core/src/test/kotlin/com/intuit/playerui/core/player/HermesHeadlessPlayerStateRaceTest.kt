package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.PlayerRuntimeException
import com.intuit.playerui.core.player.state.ReleasedState
import com.intuit.playerui.hermes.bridge.runtime.Hermes
import com.intuit.playerui.plugins.assets.ReferenceAssetsPlugin
import com.intuit.playerui.plugins.types.CommonTypesPlugin
import com.intuit.playerui.utils.test.runBlockingTest
import com.intuit.playerui.utils.test.simpleFlowString
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.util.Collections
import kotlin.concurrent.thread

internal class HermesHeadlessPlayerStateRaceTest {
    @Test
    fun `state reads during release should not crash`() = runBlockingTest(timeout = 20000) {
        val runtime = Hermes.create()
        val player = HeadlessPlayer(
            runtime,
            ReferenceAssetsPlugin(),
            CommonTypesPlugin(),
        )

        // Use a real reference-assets flow to exercise deserialization.
        player.start(simpleFlowString)

        val errors = Collections.synchronizedList(mutableListOf<Throwable>())

        val reader = thread(start = true, name = "state-reader") {
            repeat(50) {
                try {
                    player.state
                } catch (t: Throwable) {
                    errors.add(t)
                }
            }
        }

        val releaser = thread(start = true, name = "player-releaser") {
            // Give the reader a tiny head start to increase the chance of racing with getState()/deserialize.
            Thread.sleep(10)
            repeat(10) {
                player.release()
            }
        }

        reader.join()
        releaser.join()

        // If the race is hit, we should not see a raw native NPE from JSI property access.
        assertFalse(
            errors.any { it is NullPointerException || it.cause is NullPointerException },
        )
        // Runtime-related exceptions during teardown are acceptable, but should be controlled.
        assertTrue(
            errors.isEmpty() || errors.all { it is PlayerRuntimeException },
        )

        // Ensure the player is actually released by the end.
        assertTrue(player.state is ReleasedState)
    }
}
