package com.intuit.player.plugins.externalAction

import com.intuit.player.jvm.core.expressions.evaluate
import com.intuit.player.jvm.utils.test.PlayerTest
import com.intuit.player.jvm.utils.test.runBlockingTest
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.assertThrows

internal class ExternalActionPluginTest : PlayerTest() {

    override val plugins = listOf(ExternalActionPlugin())

    private val plugin get() = player.externalActionPlugin!!

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
        plugin.onExternalAction { state, _, transition ->
            assertEquals(state.transitions, mapOf("Next" to "END_FWD", "Prev" to "END_BCK"))
            assertEquals(state.ref, "test-1")

            val extra = state["extraProperty"]
            assertEquals(extra, "extraValue")
            transition("Next")
        }

        val result = player.start(jsonFlow).await()
        assertEquals(result.endState.outcome, "FWD")
    }

    @TestTemplate
    fun testExternalStateHandlingThrows() = runBlockingTest {
        plugin.onExternalAction { state, _, transition ->
            throw Exception("Bad Code")
        }

        assertEquals(
            "Bad Code",
            assertThrows<Exception> {
                runBlocking {
                    player.start(jsonFlow).await()
                }
            }.message
        )
    }

    @TestTemplate
    fun testExternalStateHandlingWithDelay() = runBlockingTest {
        player.onExternalAction { _, _, transition ->
            GlobalScope.launch {
                delay(2000)
                transition("Next")
            }
        }

        val result = player.start(jsonFlow).await()
        assertEquals(result.endState.outcome, "FWD")
    }

    @TestTemplate
    fun testExternalStateHandlingOptions() = runBlockingTest {
        player.onExternalAction { _, options, transition ->
            assertEquals(options.data.get("transitionValue"), "Next")

            // Test expression evaluation
            options.expression.evaluate("{{transitionValue}} = 'Prev'")
            assertEquals(options.data.get("transitionValue"), "Prev")

            options.expression.evaluate(listOf("{{transitionValue}} = 'Previous'", "{{transitionValue}} = 'Next'"))
            assertEquals(options.data.get("transitionValue"), "Next")
            transition("Prev")
        }

        val result = player.start(jsonFlow).await()
        assertEquals(result.endState.outcome, "BCK")
    }
}
