package com.intuit.playerui.plugins.asyncnode

import com.intuit.hooks.BailResult
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.player.state.lastViewUpdate
import com.intuit.playerui.plugins.assets.ReferenceAssetsPlugin
import com.intuit.playerui.plugins.coroutines.UpdatesPlugin
import com.intuit.playerui.plugins.coroutines.waitForUpdates
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import io.mockk.junit5.MockKExtension
import kotlinx.coroutines.yield
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.extension.ExtendWith
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

/**
 * Platform-layer (JVM) counterpart to the core JS repro
 * (plugins/async-node/core/src/__tests__/streaming-action-row.test.ts).
 *
 * GenUX Agent Chat Android (Player Android/JVM 0.15.3): the
 * `streaming-response-action-row` (copy/feedback) asset intermittently does not
 * render on the latest streamed message. AndroidPlayer.onUpdate -> expandAsset
 * fires BUILD_ASSET but the composable never runs (no RENDER).
 *
 * PURPOSE: prove what data actually crosses the JS -> Kotlin bridge into
 * `view.hooks.onUpdate`. AndroidPlayer wraps this exact HeadlessPlayer, so the
 * asset map handed to `expandAsset`/Compose is precisely what onUpdate delivers
 * here. If the action-row is present in every onUpdate payload, the data is
 * correct and the drop is Android-side (decode/recomposition), NOT a data bug.
 *
 * Core asset substitutes (types the JVM ReferenceAssetsPlugin can build):
 *   agent-response-wrapper        -> "text"
 *   streaming-response-action-row -> "action"
 */
@ExtendWith(MockKExtension::class)
internal class StreamingActionRowTest : PlayerTest() {

    /** Flatten collection view holding one live async node (the chat container). */
    private val flattenFlow =
        """
        {
          "id": "chat-flow",
          "views": [
            {
              "id": "my-view",
              "type": "collection",
              "values": [
                { "id": "msg-0", "async": true, "flatten": true }
              ]
            }
          ],
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "VIEW_1",
              "VIEW_1": {
                "state_type": "VIEW",
                "ref": "my-view",
                "transitions": { "*": "END_Done" }
              },
              "END_Done": { "state_type": "END", "outcome": "done" }
            }
          }
        }
        """.trimIndent()

    override val plugins = listOf(AsyncNodePlugin(), ReferenceAssetsPlugin(), UpdatesPlugin())

    private val plugin get() = player.asyncNodePlugin!!

    /** One streamed message: wrapper asset + action-row asset + a renewed async node. */
    private fun messagePayload(i: Int) = listOf(
        mapOf(
            "asset" to mapOf(
                "id" to "wrapper-$i",
                "type" to "text",
                "value" to "agent response $i",
            ),
        ),
        mapOf(
            "asset" to mapOf(
                "id" to "action-row-$i",
                "type" to "action",
                "value" to "actions $i",
            ),
        ),
        mapOf(
            "id" to "msg-${i + 1}",
            "async" to true,
            "flatten" to true,
        ),
    )

    /** Recursively collect every resolved asset {id,type} in the view Node. */
    private fun collectAssets(node: Any?, out: MutableList<Pair<String, String>> = mutableListOf()): List<Pair<String, String>> {
        when (node) {
            is Map<*, *> -> {
                val asset = node["asset"]
                if (asset is Map<*, *>) {
                    val id = asset["id"]?.toString()
                    val type = asset["type"]?.toString()
                    if (id != null && type != null) out.add(id to type)
                }
                node.forEach { (k, v) -> if (k != "parent") collectAssets(v, out) }
            }
            is List<*> -> node.forEach { collectAssets(it, out) }
            is Node -> {
                // Node is a Map-like bridge object; inspect via keys().
                node.keys.forEach { k -> if (k != "parent") collectAssets(node[k], out) }
            }
        }
        return out
    }

    @TestTemplate
    fun `onUpdate carries the action-row on every chained streaming update`() = runBlockingTest {
        val MESSAGES = 6

        // Streaming callback control: each renewed async node re-taps and suspends
        // until we resolve it, mirroring the consumer's stream-complete callback.
        var deferredResolve: ((asyncNodeUpdate) -> Unit)? = null
        plugin.hooks.onAsyncNode.tap("test") { _, _, _ ->
            val result = suspendCoroutine { cont ->
                deferredResolve = { value -> cont.resume(value) }
            }
            BailResult.Bail(result)
        }

        var updateNumber = 0
        player.hooks.view.tap { v ->
            v?.hooks?.onUpdate?.tap { _ -> updateNumber++ }
        }

        player.start(flattenFlow)

        for (i in 0 until MESSAGES) {
            // Wait for the current live async node to request content.
            while (deferredResolve == null) yield()
            val resolve = deferredResolve!!
            deferredResolve = null // force fresh capture for the renewed node

            // Deliver [wrapper, action-row, renewedAsync] and wait for the view update.
            val view: Node? = player.waitForUpdates { resolve(messagePayload(i)) }
            Assertions.assertNotNull(view, "expected a view update after message $i")

            val assets = collectAssets(view)

            // Every action-row 0..i must still be present in the onUpdate payload.
            for (j in 0..i) {
                Assertions.assertTrue(
                    assets.any { it.first == "action-row-$j" },
                    "after message $i, action-row-$j missing from onUpdate data. Got: $assets",
                )
            }
            // Exactly one action asset per delivered message so far.
            Assertions.assertEquals(
                i + 1,
                assets.count { it.second == "action" },
                "after message $i, wrong action-row count. Got: $assets",
            )
        }

        // Sanity: player still in-progress with a live view.
        Assertions.assertNotNull(player.inProgressState?.lastViewUpdate)
    }
}
