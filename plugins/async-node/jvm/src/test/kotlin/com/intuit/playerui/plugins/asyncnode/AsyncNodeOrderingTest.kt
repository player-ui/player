package com.intuit.playerui.plugins.asyncnode

import com.intuit.hooks.BailResult
import com.intuit.playerui.core.asset.Asset
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
 * Async-node Bail-vs-callback ordering, through the real JVM runtime + the
 * (traced) core bundle. Investigates the GenUX Agent Chat drop:
 *
 *   - New message  → handler RETURNS BailResult.Bail(fullAsset)  → core index.ts:299
 *   - Action row   → later `callback(...)` from a separate timeline → core index.ts:293
 *
 * Both write the SAME node; whichever is applied LAST wins the coalesced view
 * update. These tests impose each order to prove the consequence:
 *   - Bail applied AFTER callback  → action row clobbered (the field symptom)
 *   - callback applied AFTER Bail  → action row kept (GenUX's intended order)
 *
 * Run: bazel test //plugins/async-node/jvm:async-node-test
 * (bazel rebuilds //plugins/async-node/core:core_native_bundle from source, so
 *  the [AsyncNode:trace] logs are included; grep the test log for them.)
 *
 * NOTE: the headless runtime is single-threaded, so it won't *spontaneously*
 * reorder the two writes — these tests demonstrate the consequence of order, not
 * a live race. The actual intermittent flip is at the Android JS↔Kotlin bridge /
 * render layer (a large Bail payload's effect arriving after a small callback).
 */
@ExtendWith(MockKExtension::class)
internal class AsyncNodeOrderingTest : PlayerTest() {

    override val plugins = listOf(AsyncNodePlugin(), ReferenceAssetsPlugin(), UpdatesPlugin())

    private val plugin get() = player.asyncNodePlugin!!

    /** Flatten collection holding one live async node. */
    private val flattenFlow =
        """
        {
          "id": "chat-flow",
          "views": [
            {
              "id": "chat",
              "type": "collection",
              "values": [ { "id": "msg-0", "async": true, "flatten": true } ]
            }
          ],
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "VIEW_1",
              "VIEW_1": { "state_type": "VIEW", "ref": "chat", "transitions": {} }
            }
          }
        }
        """.trimIndent()

    private fun wrapper(i: Int) =
        mapOf("asset" to mapOf("id" to "wrapper-$i", "type" to "text", "value" to "response $i"))

    private fun actionRow(i: Int) =
        mapOf("asset" to mapOf("id" to "action-row-$i", "type" to "action", "value" to "actions $i"))

    /** Count "action" assets in the collection view's flattened values. */
    private fun actionCount(asset: Asset?): Int {
        val values = (asset as? Map<*, *>)?.get("values") as? List<*> ?: return 0
        return values.count {
            ((it as? Map<*, *>)?.get("asset") as? Map<*, *>)?.get("type") == "action"
        }
    }

    /**
     * Taps onAsyncNode so the test can drive the callback and the Bail return
     * independently: the handler captures the callback, then suspends until the
     * test releases the Bail value.
     */
    private fun setupDeferredHandler(
        onCallbackCaptured: (((Any?) -> Unit)) -> Unit,
        onReleaseCaptured: (((Any?) -> Unit)) -> Unit,
    ) {
        plugin.hooks.onAsyncNode.tap("test") { _, _, callback ->
            if (callback != null) onCallbackCaptured(callback)
            val bailValue = suspendCoroutine<Any?> { cont ->
                onReleaseCaptured { value -> cont.resume(value) }
            }
            BailResult.Bail(bailValue)
        }
    }

    @TestTemplate
    fun `bail applied AFTER callback clobbers the action row`() = runBlockingTest {
        var cb: ((Any?) -> Unit)? = null
        var releaseBail: ((Any?) -> Unit)? = null
        setupDeferredHandler({ cb = it }, { releaseBail = it })

        player.start(flattenFlow)
        while (cb == null || releaseBail == null) yield()

        // (1) callback paints [wrapper, action-row]
        val afterCallback = player.waitForUpdates { cb!!.invoke(listOf(wrapper(0), actionRow(0))) }
        Assertions.assertEquals(1, actionCount(afterCallback), "callback should paint the action row")

        // (2) Bail return resolves with a stale [wrapper] (no action row), applied AFTER the callback
        val afterBail = player.waitForUpdates { releaseBail!!.invoke(listOf(wrapper(0))) }
        Assertions.assertEquals(
            0,
            actionCount(afterBail),
            "a Bail return applied after the callback clobbers the action row (the field symptom)",
        )
    }

    @TestTemplate
    fun `callback applied AFTER bail keeps the action row`() = runBlockingTest {
        var cb: ((Any?) -> Unit)? = null
        var releaseBail: ((Any?) -> Unit)? = null
        setupDeferredHandler({ cb = it }, { releaseBail = it })

        player.start(flattenFlow)
        while (cb == null || releaseBail == null) yield()

        // (1) Bail resolves first with [wrapper] (no action row) — GenUX's new-message resolve
        val afterBail = player.waitForUpdates { releaseBail!!.invoke(listOf(wrapper(0))) }
        Assertions.assertEquals(0, actionCount(afterBail), "bail resolves without the action row")

        // (2) callback later adds the action row, applied AFTER the bail — intended order
        val afterCallback = player.waitForUpdates { cb!!.invoke(listOf(wrapper(0), actionRow(0))) }
        Assertions.assertEquals(
            1,
            actionCount(afterCallback),
            "callback applied after the bail keeps the action row (GenUX's intended sequence)",
        )
    }
}
