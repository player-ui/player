package com.intuit.playerui.core.flow

import com.intuit.playerui.core.flow.state.NavigationFlowTransitionableState
import com.intuit.playerui.core.player.state.NamedState
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import com.intuit.playerui.utils.test.simpleFlowString
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.TestTemplate

internal class FlowControllerIntegrationTest : PlayerTest() {

    @TestTemplate
    fun `test flow controller`() {
        var pendingTransition: Pair<NamedState?, String?>? = null
        var completedTransition: Pair<NamedState?, NamedState?>? = null

        player.hooks.flowController.tap { flowController ->
            flowController?.hooks?.flow?.tap { flow ->
                flow?.hooks?.beforeTransition?.tap { state, transitionValue ->
                    player.logger.info("resolving the current $state using $transitionValue")
                    pendingTransition = flow.currentState to transitionValue
                    state
                }

                flow?.hooks?.transition?.tap { from, to ->
                    player.logger.info("transitioning $from -> $to")
                    // do code cov w/ from, to, & pendingTransaction.second
                    if (pendingTransition?.first?.name != from?.name) pendingTransition = null
                    completedTransition = from to to
                }
            }
        }

        player.start(simpleFlowString)

        assertNull(pendingTransition)
        assertNull(completedTransition?.first)
        assertEquals("VIEW_1", completedTransition?.second?.name)

        player.inProgressState!!.controllers.flow.transition("*")

        val pendingFrom = pendingTransition?.first?.value as? NavigationFlowTransitionableState
        assertEquals("view-1", pendingFrom?.ref)
        assertEquals("*", pendingTransition?.second)
        assertEquals("VIEW_1", completedTransition?.first?.name)
        assertEquals("END_Done", completedTransition?.second?.name)
    }

    @TestTemplate
    fun `test flow id`() = runBlockingTest {
        val completable = player.start(
            """
{
  "id": "flow",
  "views": [
    {
      "id": "foo",
      "type": "text",
      "value": "hello"
    },
    {
      "id": "bar",
      "type": "text",
      "value": "bar"
    }
  ],
  "navigation": {
    "BEGIN": "foo",
    "foo": {
      "startState": "View1",
      "View1": {
        "state_type": "VIEW",
        "ref": "foo",
        "transitions": {
          "foo-1": "Flow2"
        }
      },
      "Flow2": {
        "state_type": "FLOW",
        "ref": "bar",
        "transitions": {
          "yay": "End"
        }
      },
      "End": {
        "state_type": "END",
        "outcome": "yay"
      }
    },
    "bar": {
      "startState": "View2",
      "View2": {
        "state_type": "VIEW",
        "ref": "bar",
        "transitions": {
          "foo-2": "Done"
        }
      },
      "Done": {
        "state_type": "END",
        "outcome": "yay"
      }
    }
  }
}
""",
        )

        val controller = player.inProgressState!!.controllers.flow
        assertEquals("foo", controller.current?.id)
        controller.transition("foo-1")
        assertEquals("bar", controller.current?.id)
        controller.transition("foo-2")

        val completedState = completable.await()
        assertEquals("yay", completedState.endState.outcome)
        assertEquals("foo", controller.current?.id)
    }
}
