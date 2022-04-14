package com.intuit.player.jvm.core.flow

import com.intuit.player.jvm.core.flow.state.NavigationFlowTransitionableState
import com.intuit.player.jvm.core.player.state.NamedState
import com.intuit.player.jvm.core.player.state.inProgressState
import com.intuit.player.jvm.utils.test.PlayerTest
import com.intuit.player.jvm.utils.test.simpleFlowString
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
}
