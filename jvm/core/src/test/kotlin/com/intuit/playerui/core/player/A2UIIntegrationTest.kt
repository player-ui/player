package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.runtime.runtimeFactory
import com.intuit.playerui.core.player.state.errorState
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.player.state.lastViewUpdate
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.plugins.a2ui.A2UIPlugin
import com.intuit.playerui.utils.mocks.ClassLoaderMocksReader
import com.intuit.playerui.utils.test.PlayerTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestTemplate

/**
 * Exercises the full A2UI pipeline headlessly: the JVM `start(flow, "a2ui")` entrypoint
 * encodes a `{ format }` options object across the bridge, the A2UI content plugin's
 * `transformContent` tap runs `adaptA2UIToFlow`, and the adapted Player flow renders.
 *
 * The snapshots are the canonical catalog from `//plugins/a2ui/mocks:jar`, read via its
 * dedicated manifest (`a2ui/mocks/manifest.json`) — the same source JS/iOS consume — so
 * this stays in lockstep with the catalog rather than inlining copies.
 *
 * Runs across every JS runtime on the classpath via [TestTemplate].
 */
internal class A2UIIntegrationTest : PlayerTest() {
    override val plugins: List<Plugin> = listOf(A2UIPlugin())

    private val catalog = ClassLoaderMocksReader(
        this::class.java.classLoader,
        manifestPath = "a2ui/mocks/manifest.json",
    ).mocks

    @Test
    fun `adapts and renders every canonical A2UI snapshot`() {
        assertTrue(catalog.isNotEmpty(), "Expected A2UI mock catalog on the classpath")

        // Each snapshot gets its own player + runtime so an errored flow can't
        // leak into the next assertion, and every failure is reported by name.
        val failures = catalog.mapNotNull { mock ->
            runCatching {
                setupPlayer(listOf(A2UIPlugin()), runtimeFactory.create())
                player.start(mock.read(this::class.java.classLoader), "a2ui")
                player.inProgressState
            }.fold(
                onSuccess = { state ->
                    if (state == null) "${mock.group}/${mock.name}: ${player.errorState?.error?.message ?: player.state}" else null
                },
                onFailure = { error -> "${mock.group}/${mock.name} threw: ${error.message}" },
            )
        }

        assertTrue(failures.isEmpty(), "A2UI snapshots that failed to adapt/render: $failures")
    }

    @TestTemplate
    fun `adapts the text snapshot into a Text view`() {
        val text = catalog.first { it.group == "text" && it.name == "basic" }
        player.start(text.read(this::class.java.classLoader), "a2ui")

        val view = player.inProgressState?.lastViewUpdate
        assertNotNull(view, "Expected a resolved view")
        assertEquals("Text", view!!["type"])
        assertEquals("Hello A2UI", view["text"])
    }

    @TestTemplate
    fun `default player format still treats content as a Player Flow`() {
        // Content started without the "a2ui" format is NOT adapted — the content
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
