package com.intuit.playerui.android.reference.assets.streaming

import com.intuit.playerui.android.reference.assets.action.Action
import com.intuit.playerui.android.reference.assets.collection.Collection
import com.intuit.playerui.android.testutils.asset.AssetTest
import com.intuit.playerui.android.testutils.asset.shouldBeAsset
import com.intuit.playerui.android.testutils.asset.shouldBeAtState
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.plugins.asyncnode.AsyncNodePlugin
// IMPORTANT: the ANDROID ReferenceAssetsPlugin (registers RenderableAsset
// factories for Collection/Text/Action), NOT the core/JVM one — otherwise the
// collection "is not registered" and the tree fails to decode.
import com.intuit.playerui.android.reference.assets.ReferenceAssetsPlugin
import com.intuit.playerui.plugins.types.CommonTypesPlugin
import com.intuit.playerui.plugins.transactions.PendingTransactionPlugin
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

/**
 * ============================================================================
 * TIER B — ANDROID RENDER PROOF (BUILDS + RUNS; RENDER-DRIVE IS THE OPEN ITEM)
 * ============================================================================
 *
 * STATUS (0.15.3): compiles and runs headless (Robolectric). The chat-message
 * transform + async node DECODE correctly into the RenderableAsset tree once
 * the ANDROID ReferenceAssetsPlugin is used (see import note below). The OPEN
 * item is driving an async *streaming* update and asserting the appended
 * action-row RENDERS: `awaitRendered()` times out because (a) no existing
 * Android test establishes the async-resolve drive pattern, and (b) Robolectric
 * does not run real Compose recomposition frames, so hydration of async content
 * can hang. RECOMMENDATION: keep the decode assertion here (Robolectric), move
 * the render/recomposition assertion to a Compose-UI test (createComposeRule,
 * assert testTag("action") appears per update) or an on-device instrumented run.
 *
 * This is the decisive Android-layer test for the GenUX Agent Chat Android
 * missing-`streaming-response-action-row` bug (Player Android/JVM 0.15.3).
 *
 * The core JS repro (plugins/async-node/core/.../streaming-action-row.test.ts)
 * and the JVM boundary repro (plugins/async-node/jvm/.../StreamingActionRowTest.kt)
 * both PASS: the resolved AST and the JS->Kotlin `onUpdate` payload always
 * contain the action-row. So the drop is downstream of `onUpdate`, in the
 * Android decode (`expandAsset`) + Compose recomposition path.
 *
 * This test drives the *real* `AndroidPlayer.onUpdate -> expandAsset -> render`
 * pipeline (via AssetTest, which is Robolectric-headless) and asserts that,
 * after each chained streaming update, the action-row:
 *   1. survives decode into the RenderableAsset tree (BUILD_ASSET equivalent), and
 *   2. actually RENDERS to a hydrated View (the missing "RENDER" in the logs).
 *
 * Expected outcome: if this REPRODUCES (action-row present in the asset tree but
 * missing/never-hydrated in the rendered View), the bug is localized to Compose
 * recomposition of appended flattened siblings. If it passes, the bug is deeper
 * (Compose in the real app host, not the reference renderer).
 *
 * ----------------------------------------------------------------------------
 * WHY IT CAN'T RUN IN THE DEBUG SANDBOX YET (for the Android team):
 *   - Needs the Android SDK + Robolectric (`kt_android_local_test`); the debug
 *     sandbox had no SDK (aapt2 unavailable).
 *   - `AsyncNodePlugin` lives in `//plugins/async-node/jvm`, which is NOT on the
 *     `reference-assets-android` instrumented_test_deps classpath yet. Add:
 *         instrumented_test_deps = [ ..., "//plugins/async-node/jvm" ]
 *     in plugins/reference-assets/android/BUILD.
 *
 * TODO(android-team) before running:
 *   - Confirm the reference `action` asset's required props (it needs a `label`
 *     asset + a `run`/`exp`; the placeholder below may need adjusting to decode).
 *   - Confirm the async-handler threading on AndroidPlayer matches this shape
 *     (constructor handler vs. hooks.onAsyncNode tap).
 *   - Verify the render/hydration assertion (`currentView`) is the right signal
 *     for "the composable ran" — that's the exact thing missing in the field logs.
 * ----------------------------------------------------------------------------
 */
public class StreamingActionRowRenderTest : AssetTest("chat-message") {

    /** Captures the async resolver so the test drives streaming updates. */
    private var deferredResolve: ((Any?) -> Unit)? = null

    override val plugins: List<Plugin> by lazy {
        listOf(
            // Deferred async handler: suspends until the test resolves it, mirroring
            // the consumer's stream-complete callback.
            AsyncNodePlugin(
                asyncHandler = { _, _ ->
                    suspendCoroutine { cont ->
                        deferredResolve = { value -> cont.resume(value) }
                    }
                },
            ),
            ReferenceAssetsPlugin(),
            CommonTypesPlugin(),
            PendingTransactionPlugin(),
        )
    }

    /** One streamed turn: wrapper text + action-row + renewed async node (flatten). */
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
                // NOTE(android-team): reference `action` asset may require a `label`
                // asset and an `exp`/`run`. Adjust to whatever decodes cleanly.
                "value" to "next",
                "label" to mapOf(
                    "asset" to mapOf(
                        "id" to "action-row-label-$i",
                        "type" to "text",
                        "value" to "actions $i",
                    ),
                ),
            ),
        ),
        mapOf(
            "id" to "msg-${i + 1}",
            "async" to true,
            "flatten" to true,
        ),
    )

    @Test
    public fun `action-row renders after every chained streaming update`() {
        // chat-message content: transform -> flatten collection with a live async node.
        launchMock("chat-message-basic")

        runTest {
            val TURNS = 5
            for (i in 0 until TURNS) {
                // Wait for the live async node to request content.
                while (deferredResolve == null) kotlinx.coroutines.yield()
                val resolve = deferredResolve!!
                deferredResolve = null

                resolve(messagePayload(i))

                // Suspend until this update renders + fully hydrates. If the
                // action-row is dropped in recomposition, this times out — which
                // is itself the reproduction signal.
                awaitRendered()

                // 1) Decoded RenderableAsset tree must contain this turn's action-row.
                var foundActionRow = false
                currentAssetTree.shouldBeAsset<Collection> {
                    val values = getData().values
                    // The action-row decodes to an Action asset somewhere in values.
                    foundActionRow = values.any { it is Action }
                }
                assertTrue(
                    "turn $i: action-row missing from decoded RenderableAsset tree (BUILD_ASSET stage)",
                    foundActionRow,
                )

                // 2) The tree must actually RENDER to a hydrated View. This is the
                //    exact step that never fires in the field logs (no RENDER).
                //    `currentView` blocks until the asset tree is fully hydrated.
                assertNotNull(
                    "turn $i: rendered/hydrated View was null — recomposition dropped the update",
                    currentView,
                )

                player.shouldBeAtState<InProgressState>()
            }
        }
    }
}
