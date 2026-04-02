package com.intuit.playerui.plugins.externalAction

import com.intuit.playerui.core.expressions.evaluate
import com.intuit.playerui.core.player.state.ControllerState
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import com.intuit.playerui.utils.test.setupPlayer
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.assertThrows

internal class ExternalActionPluginTest : PlayerTest() {
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
    fun testExternalActionHandling() = runBlockingTest {
        val plugin = ExternalActionPlugin(
            ExternalActionHandler(
                match = mapOf("ref" to "test-1"),
                handler = { state, _, transition ->
                    assertEquals(state.transitions, mapOf("Next" to "END_FWD", "Prev" to "END_BCK"))
                    assertEquals(state.ref, "test-1")

                    val extra = state["extraProperty"]
                    assertEquals(extra, "extraValue")
                    transition("Next")
                },
            ),
        )

        setupPlayer(plugin)
        val result = player.start(jsonFlow).await()
        assertEquals(result.endState.outcome, "FWD")
    }

    @TestTemplate
    fun testExternalActionHandlingThrows() = runBlockingTest {
        val plugin = ExternalActionPlugin(
            ExternalActionHandler(
                match = mapOf("ref" to "test-1"),
                handler = { _, _, _ ->
                    throw Exception("Bad Code")
                },
            ),
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
    fun testExternalActionHandlingWithDelay() = runBlockingTest {
        val plugin = ExternalActionPlugin(
            ExternalActionHandler(
                match = mapOf("ref" to "test-1"),
                handler = { _, _, transition ->
                    launch {
                        delay(2000)
                        transition("Next")
                    }
                },
            ),
        )

        setupPlayer(plugin)
        val result = player.start(jsonFlow).await()
        assertEquals(result.endState.outcome, "FWD")
    }

    @TestTemplate
    fun testExternalActionHandlingOptions() = runBlockingTest {
        var callbackOptions: ControllerState? = null

        val plugin = ExternalActionPlugin(
            ExternalActionHandler(
                match = mapOf("ref" to "test-1"),
                handler = { _, options, transition ->
                    callbackOptions = options
                    transition("Prev")
                },
            ),
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
    fun testExternalActionHandlingWithSpecificity() = runBlockingTest {
        var lessSpecificCalled = false
        var moreSpecificCalled = false

        val plugin = ExternalActionPlugin(
            // Less specific - only matches ref
            ExternalActionHandler(
                match = mapOf("ref" to "test-1"),
                handler = { _, _, transition ->
                    lessSpecificCalled = true
                    transition("Prev")
                },
            ),
            // More specific - matches ref and extraProperty
            ExternalActionHandler(
                match = mapOf("ref" to "test-1", "extraProperty" to "extraValue"),
                handler = { _, _, transition ->
                    moreSpecificCalled = true
                    transition("Next")
                },
            ),
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
        val plugin1 = ExternalActionPlugin(
            ExternalActionHandler(
                match = mapOf("ref" to "test-1"),
                handler = { _, _, transition ->
                    transition("Next")
                },
            ),
        )

        val plugin2 = ExternalActionPlugin(
            ExternalActionHandler(
                match = mapOf("ref" to "test-1"),
                handler = { _, _, transition ->
                    transition("Prev")
                },
            ),
        )

        setupPlayer(plugin1, plugin2)
        val result = player.start(jsonFlow).await()

        // Last handler registered wins (Prev)
        assertEquals(result.endState.outcome, "BCK")
    }

    @TestTemplate
    fun testHandlerConfigRequiresRef() {
        val exception = assertThrows<IllegalArgumentException> {
            ExternalActionHandler(
                match = mapOf("extraProperty" to "value"),
                handler = ExternalActionHandler.Handler { _, _, transition -> transition("Next") },
            )
        }
        assertTrue(exception.message?.contains("must contain a 'ref' key") == true)
    }
}
