package com.intuit.playerui.android.reference.demo.test.streaming

import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.onAllNodesWithTag
import com.intuit.playerui.android.reference.demo.test.base.ComposeUITest
import com.intuit.playerui.android.testutils.asset.shouldBeAtState
import com.intuit.playerui.core.player.state.InProgressState
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * ============================================================================
 * TIER B (render) — COMPOSE-UI TEST  *** DRAFT — NOT YET RUN ***
 * ============================================================================
 *
 * Purpose: the one test that can actually catch the GenUX Agent Chat Android
 * bug — an async-streamed `streaming-response-action-row` that decodes but never
 * RENDERS. Unlike the Robolectric Tier B test (which can't run real Compose
 * recomposition frames), a Compose-UI test on an emulator/device drives genuine
 * recomposition, so it can observe whether the appended action-row's composable
 * actually appears.
 *
 * Assertion model: after each streamed message, the number of Compose nodes with
 * testTag("action") (the reference Action asset's Button, see Action.kt) must
 * grow by one. If the count stalls while the data/decode layers say the action-
 * row is present (proven by the JVM + Robolectric-decode tests), THIS is the
 * reproduction — the drop is Compose recomposition of appended flattened siblings.
 *
 * ---------------------------------------------------------------------------
 * STATUS vs. the other tiers:
 *   - Core JS repro (streaming-action-row.test.ts) ............ RUN, PASS
 *   - JVM onUpdate boundary (StreamingActionRowTest.kt) ....... RUN, PASS
 *   - Robolectric decode (StreamingActionRowRenderTest.kt) .... RUN, decode OK
 *   - THIS (Compose-UI render) ........................... DRAFT, UNVALIDATED
 *
 * NOTE: this file was NOT compiled or run in the investigation sandbox — the
 * demo UI-test build pulls the Android NDK (ANDROID_NDK_HOME) even to compile,
 * and running needs an emulator/device. Treat the code below as a starting
 * point to be compiled/adjusted in a full Android dev setup, not a proven test.
 *
 * TWO PREREQUISITES before this can run (neither exists in the repo today —
 * which is itself why the bug was never caught by a test):
 *
 * (1) The demo player has NO AsyncNodePlugin, so async nodes never resolve in
 *     the demo app. Add it to DemoPlayerViewModel.plugins with a streaming
 *     handler, e.g.:
 *
 *         AsyncNodePlugin(
 *             asyncHandler = { _, _ ->
 *                 // return the next [wrapper, action-row, renewedAsync] chunk;
 *                 // renew the async node each time to keep the stream live.
 *             },
 *         )
 *
 *     Better for a deterministic test: a dedicated test PlayerViewModel/Activity
 *     whose handler is driven by the test (capture the continuation, resume it
 *     per message) rather than a timer.
 *
 * (2) A streaming chat mock under android/demo/src/main/assets/mocks/streaming/
 *     — a flatten collection (agent-chat-container) holding one live async node,
 *     modeled on plugins/reference-assets/mocks/chat-message/chat-message-basic.tsx.
 *
 * BUILD: once prerequisite (1) is wired, add "//plugins/async-node/jvm" to the
 * android/demo deps (for DemoPlayerViewModel) and run on an emulator/device:
 *
 *     bazel test //android/demo:demo-StreamingActionRowComposeUITest-instrumented-test
 *
 * (Compose-UI tests need a real Android runtime; this is not a Robolectric
 * local test — it belongs in the on-device instrumented UI suite, alongside
 * ActionUITest / MainActivityTest.)
 * ---------------------------------------------------------------------------
 */
class StreamingActionRowComposeUITest : ComposeUITest("streaming") {

    @Test
    fun `each streamed message adds a rendered action-row`() {
        // Requires prerequisite (2): a streaming chat mock that starts with one
        // live async node and streams N messages of [wrapper, action-row, renewedAsync].
        launchMock("streaming-action-rows")

        val expectedMessages = 5

        // As each message streams in, one more Action button (testTag("action"))
        // must become present AND stay present. waitUntil* drives real recomposition.
        for (i in 1..expectedMessages) {
            androidComposeRule.waitUntilNodeCount(hasTestTag("action"), i, timeoutMillis = 5_000L)

            val rendered = androidComposeRule
                .onAllNodesWithTag("action")
                .fetchSemanticsNodes()
                .size
            assertEquals(
                "after message $i, expected $i rendered action-rows but found $rendered — " +
                    "if the data/decode tiers pass and this stalls, the drop is Compose recomposition",
                i,
                rendered,
            )
        }

        player.shouldBeAtState<InProgressState>()
    }
}
