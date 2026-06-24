package com.intuit.playerui.core.player

import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.player.state.lastViewUpdate
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.plugins.a2ui.A2UIPlugin
import com.intuit.playerui.utils.test.PlayerTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.TestTemplate

/**
 * Exercises the full A2UI pipeline headlessly: the JVM `start(flow, "a2ui")` entrypoint
 * encodes a `{ format }` options object across the bridge, the A2UI content plugin's
 * `transformContent` tap runs `adaptA2UIToFlow`, and the adapted Player flow renders.
 *
 * Runs across every JS runtime on the classpath via [TestTemplate].
 */
internal class A2UIIntegrationTest : PlayerTest() {
    override val plugins: List<Plugin> = listOf(A2UIPlugin())

    private val textSnapshot =
        """
        {
          "surfaceId": "text-basic",
          "components": [
            { "id": "root", "component": "Text", "text": "Hello A2UI", "variant": "body" }
          ]
        }
        """.trimIndent()

    private val columnSnapshot =
        """
        {
          "surfaceId": "column-basic",
          "components": [
            { "id": "root", "component": "Column", "children": ["a", "b"], "align": "start" },
            { "id": "a", "component": "Text", "text": "First", "variant": "h3" },
            { "id": "b", "component": "Text", "text": "Second" }
          ]
        }
        """.trimIndent()

    @TestTemplate
    fun `starts an A2UI snapshot via the a2ui format and renders the adapted Text view`() {
        player.start(textSnapshot, "a2ui")

        val state = player.inProgressState
        assertNotNull(state, "Expected an in-progress state after starting an A2UI snapshot")

        val view = state!!.lastViewUpdate
        assertNotNull(view, "Expected a resolved view after the A2UI content was adapted")
        assertEquals("Text", view!!["type"])
        assertEquals("Hello A2UI", view["text"])
    }

    @TestTemplate
    fun `adapts an A2UI Column with inlined children`() {
        player.start(columnSnapshot, "a2ui")

        val view = player.inProgressState?.lastViewUpdate
        assertNotNull(view, "Expected a resolved view")
        assertEquals("Column", view!!["type"])
    }

    @TestTemplate
    fun `default player format still treats content as a Player Flow`() {
        // A snapshot started without the "a2ui" format is NOT adapted — the content
        // plugin passes it through, proving the default entrypoint is unchanged.
        val plainFlow =
            """
            {
              "id": "plain",
              "views": [{ "id": "v", "type": "text", "value": "hi" }],
              "navigation": {
                "BEGIN": "FLOW",
                "FLOW": { "startState": "VIEW", "VIEW": { "state_type": "VIEW", "ref": "v", "transitions": { "*": "END" } }, "END": { "state_type": "END", "outcome": "done" } }
              }
            }
            """.trimIndent()
        player.start(plainFlow)
        assertEquals("text", player.inProgressState?.lastViewUpdate?.get("type"))
    }
}
