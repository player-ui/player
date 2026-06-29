package com.intuit.playerui.a2ui

import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.player.state.lastViewUpdate
import com.intuit.playerui.utils.test.PlayerTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.TestTemplate

/**
 * Verifies the preconfigured [A2UIHeadlessPlayer] adapts and renders an A2UI snapshot
 * with no manual plugin wiring. Runs across every JS runtime via [TestTemplate].
 */
internal class A2UIHeadlessPlayerTest : PlayerTest() {
    private val snapshot =
        """
        { "surfaceId": "t", "components": [
          { "id": "root", "component": "Text", "text": "Preset", "variant": "body" }
        ] }
        """.trimIndent()

    @TestTemplate
    fun `preconfigured player adapts an A2UI snapshot out of the box`() {
        val player = A2UIHeadlessPlayer(explicitRuntime = runtime)

        player.start(snapshot, "a2ui")

        assertNotNull(player.inProgressState, "Expected the preset player to render the A2UI snapshot")
        assertEquals("Text", player.inProgressState?.lastViewUpdate?.get("type"))
        assertEquals("Preset", player.inProgressState?.lastViewUpdate?.get("text"))
    }
}
