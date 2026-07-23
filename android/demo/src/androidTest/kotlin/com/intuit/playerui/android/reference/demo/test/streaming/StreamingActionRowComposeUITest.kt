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
 *   - THIS (Compose-UI render) ....... RAN ON EMULATOR (android-34 arm64), PASS
 *
 * RESULT: with the stream marshaled to the main thread (see the callback-on-
 * Dispatchers.Main handler in DemoPlayerViewModel), all MAX_STREAMED_ACTION_ROWS
 * action-rows RENDER — waitUntilNodeCount(hasTestTag("action"), N) succeeds.
 * So the reference Compose renderer does NOT drop async-streamed flattened
 * siblings.
 *
 * CONCLUSION for the GenUX bug: every layer exercised with the *reference*
 * assets is clean — core AST (JS), the JS->Kotlin onUpdate data (JVM), decode
 * (Robolectric), and now on-device Compose render. The missing action-row is
 * therefore NOT in Player core / reference rendering; it lives in the GenUX-
 * specific layer — most likely (a) the custom agent-response-wrapper /
 * streaming-response-action-row asset recomposition, or (b) the host's async
 * stream-complete callback threading. NB: an earlier iteration that resolved the
 * stream on a *background* dispatcher threw CalledFromWrongThreadException, and
 * only main-thread-marshaled updates render correctly — so if GenUX's callback
 * isn't consistently on the main thread, that is a prime suspect for the
 * intermittent drop.
 *
 * ENABLING PIECES (now wired in this branch — neither existed before, which is
 * itself why no test caught this):
 *
 * (1) DemoPlayerViewModel now includes an AsyncNodePlugin that AUTO-STREAMS a
 *     bounded sequence of [wrapper, action-row, renewedAsync] chunks whenever a
 *     flow contains a live async node (MAX_STREAMED_ACTION_ROWS messages). No
 *     test-side continuation control needed — the app streams on its own.
 * (2) Mock android/demo/src/main/assets/mocks/streaming/streaming-action-rows.json
 *     — a flatten collection holding one live async node.
 * (3) android/demo main_deps gains //plugins/async-node/jvm.
 *
 * RUN (on an emulator/device — this is the on-device instrumented suite, not
 * Robolectric): bazel test //android/demo:android_instrumentation_test
 * ---------------------------------------------------------------------------
 */
class StreamingActionRowComposeUITest : ComposeUITest("streaming") {

    // NB: no spaces in the method name — the on-device APK is DEXed and D8 rejects
    // spaces in the generated inline-lambda class names (e.g. shouldBeAtState).
    @Test
    fun everyStreamedActionRowRenders() {
        launchMock("streaming-action-rows")

        // The demo player auto-streams MAX_STREAMED_ACTION_ROWS messages, each
        // appending one Action asset (testTag("action")). Every one must render:
        // a shortfall means recomposition dropped an appended flattened sibling —
        // the reproduction (data + decode tiers already proven clean).
        val expected = 5 // = DemoPlayerViewModel.MAX_STREAMED_ACTION_ROWS

        androidComposeRule.waitUntilNodeCount(hasTestTag("action"), expected, timeoutMillis = 10_000L)

        val rendered = androidComposeRule
            .onAllNodesWithTag("action")
            .fetchSemanticsNodes()
            .size
        assertEquals(
            "expected $expected rendered action-rows (one per streamed message); " +
                "a shortfall means Compose recomposition dropped an appended action-row",
            expected,
            rendered,
        )

        player.shouldBeAtState<InProgressState>()
    }
}
