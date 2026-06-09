package com.intuit.playerui.core.player

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.lastViewUpdate
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.plugins.a2ui.A2UIPlugin
import com.intuit.playerui.plugins.types.CommonTypesPlugin
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate

/**
 * End-to-end check that the JVM [A2UIPlugin] bundle translates an A2UI snapshot
 * into a render-ready Player flow when started with `format = "a2ui"`.
 *
 * This exercises the full chain: [Player.start] forwards the content meta to the
 * JS player, whose `transformContent` hook (tapped by the bundled A2UI content
 * plugin) runs `adaptA2UIToFlow` to produce a Player flow that resolves into the
 * expected nested asset tree.
 */
internal class A2UIContentIntegrationTest : PlayerTest() {
    override val plugins: List<Plugin> = listOf(A2UIPlugin(), CommonTypesPlugin())

    // A2UI snapshot: a Button whose child is a Text label. Flat component list
    // linked by id, rooted at "root" — adaptA2UIToFlow inlines this into a tree.
    private val buttonSnapshot =
        """
        {
          "surfaceId": "button-basic",
          "components": [
            { "id": "root", "component": "Button", "child": "lbl", "variant": "primary" },
            { "id": "lbl", "component": "Text", "text": "Click me" }
          ]
        }
        """.trimIndent()

    // A2UI snapshot exercising the Intl-backed `formatCurrency` expression. On
    // Hermes (no `Intl` global) this previously threw `ReferenceError: Property
    // 'Intl' doesn't exist`; the core format handlers now fall back to pure JS.
    private val currencySnapshot =
        """
        {
          "surfaceId": "expressions-currency",
          "data": { "order": { "subtotal": 1299.5 } },
          "components": [
            {
              "id": "root",
              "component": "Text",
              "text": {
                "call": "formatCurrency",
                "args": {
                  "value": { "path": "/order/subtotal" },
                  "currency": "USD",
                  "locale": "en-US"
                }
              }
            }
          ]
        }
        """.trimIndent()

    @TestTemplate
    fun `a2ui snapshot is translated into a renderable flow`() = runBlockingTest {
        player.start(buttonSnapshot, StartOptions(format = "a2ui"))

        val state = player.state
        assertTrue(state is InProgressState) { "Expected A2UI snapshot to start, but was $state" }
        state as InProgressState

        val root: Asset? = state.lastViewUpdate
        assertNotNull(root, "Expected a resolved view for the translated A2UI flow")
        assertEquals("Button", root!!.type)

        // The Button's Text child should be inlined as a nested {asset: ...} node.
        val childAsset = root.getAsset("child")?.asset
        assertEquals("Text", childAsset?.type)
    }

    @TestTemplate
    fun `formatCurrency expression resolves without Intl`() = runBlockingTest {
        player.start(currencySnapshot, StartOptions(format = "a2ui"))

        val state = player.state
        assertTrue(state is InProgressState) { "Expected currency snapshot to start, but was $state" }
        state as InProgressState

        val root: Asset? = state.lastViewUpdate
        assertNotNull(root, "Expected a resolved view for the currency A2UI flow")
        assertEquals("Text", root!!.type)
        // Hermes fallback yields "$1,299.50"; full-Intl runtimes yield the same en-US output.
        assertEquals("\$1,299.50", root.getString("text"))
    }
}
