package com.intuit.player.plugins.coroutines

import com.intuit.player.jvm.core.flow.Flow
import com.intuit.player.jvm.core.player.Player
import com.intuit.player.jvm.core.player.state.CompletedState
import com.intuit.player.jvm.core.player.state.InProgressState
import com.intuit.player.jvm.core.player.state.PlayerFlowState
import com.intuit.player.jvm.core.player.state.ReleasedState
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.invoke
import io.mockk.junit5.MockKExtension
import io.mockk.slot
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.isActive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith

@ExtendWith(MockKExtension::class)
internal class FlowScopePluginTest {

    private val scope = CoroutineScope(Dispatchers.Default)

    @MockK lateinit var player: Player

    @MockK lateinit var inProgressState: InProgressState

    @MockK lateinit var completedState: CompletedState

    @MockK lateinit var flow: Flow

    var stateTap = slot<(PlayerFlowState?) -> Unit>()

    private lateinit var flowScopePlugin: FlowScopePlugin

    @BeforeEach fun setup() {
        every { player.hooks.state.tap(any(), capture(stateTap)) } returns "some-id"
        every { inProgressState.flow } returns flow

        flowScopePlugin = FlowScopePlugin().apply {
            apply(player)
        }
    }

    private fun transitionToInProgress() = stateTap.invoke(inProgressState)
    private fun transitionToEnd() = stateTap.invoke(completedState)
    private fun transitionToReleased() = stateTap.invoke(ReleasedState)

    @Test fun testNewScope() {
        assertNull(flowScopePlugin.flowScope)
        transitionToInProgress()
        assertNotNull(flowScopePlugin.flowScope)
        assertTrue(flowScopePlugin.flowScope!!.isActive)
    }

    @Test fun testScopeCancelledOnEnd() {
        assertNull(flowScopePlugin.flowScope)
        transitionToInProgress()
        assertNotNull(flowScopePlugin.flowScope)
        assertTrue(flowScopePlugin.flowScope!!.isActive)
        transitionToEnd()
        assertFalse(flowScopePlugin.flowScope!!.isActive)
    }

    @Test fun testScopeCancelledOnReleased() {
        assertNull(flowScopePlugin.flowScope)
        transitionToInProgress()
        assertNotNull(flowScopePlugin.flowScope)
        assertTrue(flowScopePlugin.flowScope!!.isActive)
        transitionToReleased()
        assertFalse(flowScopePlugin.flowScope!!.isActive)
    }

    @Test fun testSubScopeCancelled() {
        assertNull(flowScopePlugin.flowScope)
        transitionToInProgress()
        assertNotNull(flowScopePlugin.flowScope)
        assertTrue(flowScopePlugin.flowScope!!.isActive)

        val subScope = flowScopePlugin.subScope()
        assertNotNull(subScope)
        assertTrue(subScope!!.isActive)

        transitionToEnd()
        assertFalse(flowScopePlugin.flowScope!!.isActive)
        assertFalse(subScope.isActive)
    }

    @Test fun testFlowContext() {
        assertNull(flowScopePlugin.flowScope)
        transitionToInProgress()
        assertNotNull(flowScopePlugin.flowScope)
        assertTrue(flowScopePlugin.flowScope!!.isActive)
        assertEquals(flow, flowScopePlugin.flowScope!!.flow)
        val subScope = flowScopePlugin.subScope()
        assertNotNull(subScope)
        assertEquals(flow, subScope!!.flow)
    }

    @Test fun testRuntimeScopeCancelsFlowScope() {
        assertNull(flowScopePlugin.flowScope)
        transitionToInProgress()
        assertNotNull(flowScopePlugin.flowScope)
        assertTrue(flowScopePlugin.flowScope!!.isActive)
        scope.cancel()
        assertFalse(flowScopePlugin.flowScope!!.isActive)
    }
}
