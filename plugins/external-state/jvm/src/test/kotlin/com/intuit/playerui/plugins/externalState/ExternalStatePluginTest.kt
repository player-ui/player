package com.intuit.playerui.plugins.externalState

import com.intuit.hooks.BailResult
import com.intuit.playerui.core.error.ErrorController
import com.intuit.playerui.core.expressions.evaluate
import com.intuit.playerui.core.player.PlayerExceptionMetadata
import com.intuit.playerui.core.player.state.ControllerState
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import com.intuit.playerui.utils.test.setupPlayer
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.assertThrows

internal class ExternalStatePluginTest : PlayerTest() {
    private val jsonFlow =
        """
{
  "id": "test-flow",
  "data": {
    "transitionValue": "Next"
  },
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "EXT_1",
      "EXT_1": {
        "state_type": "EXTERNAL",
        "ref": "test-1",
        "transitions": {
          "Next": "END_FWD",
          "Prev": "END_BCK"
        },
        "extraProperty": "extraValue"
      },
      "END_FWD": {
        "state_type": "END",
        "outcome": "FWD"
      },
      "END_BCK": {
        "state_type": "END",
        "outcome": "BCK"
      }
    }
  }
}
        """

    @TestTemplate
    fun testExternalStateHandling() = runBlockingTest {
        val plugin = ExternalStatePlugin(
            ExternalStateHandler(ref = "test-1") { state, _, transition ->
                assertEquals(state.transitions, mapOf("Next" to "END_FWD", "Prev" to "END_BCK"))
                assertEquals(state.ref, "test-1")

                val extra = state["extraProperty"]
                assertEquals(extra, "extraValue")
                transition("Next")
            },
        )

        setupPlayer(plugin)
        val result = player.start(jsonFlow).await()
        assertEquals(result.endState.outcome, "FWD")
    }

    @TestTemplate
    fun testExternalStateHandlingThrows() = runBlockingTest {
        val plugin = ExternalStatePlugin(
            ExternalStateHandler(ref = "test-1") { _, _, _ ->
                throw Exception("Bad Code")
            },
        )

        setupPlayer(plugin)
        assertEquals(
            "Bad Code",
            assertThrows<Exception> {
                runBlocking {
                    player.start(jsonFlow).await()
                }
            }.message,
        )
    }

    @TestTemplate
    fun testExternalStateHandlingWithDelay() = runBlockingTest {
        val plugin = ExternalStatePlugin(
            ExternalStateHandler(ref = "test-1") { _, _, transition ->
                launch {
                    delay(2000)
                    transition("Next")
                }
            },
        )

        setupPlayer(plugin)
        val result = player.start(jsonFlow).await()
        assertEquals(result.endState.outcome, "FWD")
    }

    @TestTemplate
    fun testExternalStateHandlingOptions() = runBlockingTest {
        var callbackOptions: ControllerState? = null

        val plugin = ExternalStatePlugin(
            ExternalStateHandler(ref = "test-1") { _, options, transition ->
                callbackOptions = options
                transition("Prev")
            },
        )

        setupPlayer(plugin)
        val result = player.start(jsonFlow).await()
        assertEquals(result.endState.outcome, "BCK")

        assertEquals(callbackOptions!!.data.get("transitionValue"), "Next")
        callbackOptions!!.expression.evaluate("{{transitionValue}} = 'Prev'")
        assertEquals(callbackOptions!!.data.get("transitionValue"), "Prev")
        callbackOptions!!.expression.evaluate(listOf("{{transitionValue}} = 'Previous'", "{{transitionValue}} = 'Next'"))
        assertEquals(callbackOptions!!.data.get("transitionValue"), "Next")
    }

    @TestTemplate
    fun testExternalStateHandlingWithSpecificity() = runBlockingTest {
        var lessSpecificCalled = false
        var moreSpecificCalled = false

        val plugin = ExternalStatePlugin(
            // Less specific - only matches ref
            ExternalStateHandler(ref = "test-1") { _, _, transition ->
                lessSpecificCalled = true
                transition("Prev")
            },
            // More specific - matches ref and extraProperty
            ExternalStateHandler(ref = "test-1", match = mapOf("extraProperty" to "extraValue")) { _, _, transition ->
                moreSpecificCalled = true
                transition("Next")
            },
        )

        setupPlayer(plugin)
        val result = player.start(jsonFlow).await()

        // More specific handler should have been called
        assertTrue(moreSpecificCalled, "More specific handler should have been called")
        assertTrue(!lessSpecificCalled, "Less specific handler should not have been called")
        assertEquals(result.endState.outcome, "FWD")
    }

    @TestTemplate
    fun testMultiplePluginsLastOneWins() = runBlockingTest {
        val plugin1 = ExternalStatePlugin(
            ExternalStateHandler(ref = "test-1") { _, _, transition ->
                transition("Next")
            },
        )

        val plugin2 = ExternalStatePlugin(
            ExternalStateHandler(ref = "test-1") { _, _, transition ->
                transition("Prev")
            },
        )

        setupPlayer(plugin1, plugin2)
        val result = player.start(jsonFlow).await()

        // Last handler registered wins (Prev)
        assertEquals(result.endState.outcome, "BCK")
    }

    private val flowWithErrorTransitions =
        """
{
  "id": "test-flow",
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "EXT_1",
      "errorTransitions": {
        "externalState": "END_ERROR"
      },
      "EXT_1": {
        "state_type": "EXTERNAL",
        "ref": "test-1",
        "transitions": {
          "Next": "END_FWD"
        }
      },
      "END_FWD": {
        "state_type": "END",
        "outcome": "FWD"
      },
      "END_ERROR": {
        "state_type": "END",
        "outcome": "ERROR"
      }
    }
  }
}
        """

    @TestTemplate
    fun testMissingHandlerNavigatesViaContentErrorTransitions() = runBlockingTest {
        val plugin = ExternalStatePlugin(
            ExternalStateHandler(ref = "different-ref") { _, _, transition ->
                transition("Next")
            },
        )

        setupPlayer(plugin)
        val result = player.start(flowWithErrorTransitions).await()
        assertEquals("ERROR", result.endState.outcome)
    }

    @TestTemplate
    fun testMissingTransitionValueNavigatesViaContentErrorTransitions() = runBlockingTest {
        val plugin = ExternalStatePlugin(
            ExternalStateHandler(ref = "test-1") { _, _, transition ->
                transition("")
            },
        )

        setupPlayer(plugin)
        val result = player.start(flowWithErrorTransitions).await()
        assertEquals("ERROR", result.endState.outcome)
    }

    @TestTemplate
    fun testMissingHandlerIsObservableViaOnErrorTap() = runBlockingTest {
        val errorCaptured = CompletableDeferred<Throwable>()

        val plugin = ExternalStatePlugin(
            ExternalStateHandler(ref = "different-ref") { _, _, transition ->
                transition("Next")
            },
        )

        setupPlayer(plugin)
        player.hooks.errorController.tap("test") { errorController: ErrorController? ->
            errorController?.hooks?.onError?.tap("test") { error: Throwable? ->
                error?.let { errorCaptured.complete(it) }
                BailResult.Bail(true) // suppress default navigation
            }
        }

        player.start(jsonFlow)

        val metadata = errorCaptured.await() as? PlayerExceptionMetadata
        assertNotNull(metadata)
        assertEquals("externalState", metadata?.type)
        assertEquals("missing-handler", metadata?.metadata?.get("reason"))
        assertEquals("test-1", metadata?.metadata?.get("ref"))
    }

    @TestTemplate
    fun testMissingTransitionValueIsObservableViaOnErrorTap() = runBlockingTest {
        val errorCaptured = CompletableDeferred<Throwable>()

        val plugin = ExternalStatePlugin(
            ExternalStateHandler(ref = "test-1") { _, _, transition ->
                transition("")
            },
        )

        setupPlayer(plugin)
        player.hooks.errorController.tap("test") { errorController: ErrorController? ->
            errorController?.hooks?.onError?.tap("test") { error: Throwable? ->
                error?.let { errorCaptured.complete(it) }
                BailResult.Bail(true) // suppress default navigation
            }
        }

        player.start(jsonFlow)

        val metadata = errorCaptured.await() as? PlayerExceptionMetadata
        assertNotNull(metadata)
        assertEquals("externalState", metadata?.type)
        assertEquals("missing-transition-value", metadata?.metadata?.get("reason"))
        assertEquals("test-1", metadata?.metadata?.get("ref"))
    }
}
