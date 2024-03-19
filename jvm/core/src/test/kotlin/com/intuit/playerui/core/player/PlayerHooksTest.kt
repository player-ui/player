package com.intuit.playerui.core.player

import com.intuit.playerui.core.NodeBaseTest
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook1
import com.intuit.playerui.core.data.DataController
import com.intuit.playerui.core.flow.FlowController
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.core.view.ViewController
import io.mockk.every
import io.mockk.impl.annotations.MockK
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class PlayerHooksTest : NodeBaseTest() {
    @MockK
    private lateinit var fc: NodeSyncHook1<FlowController>

    @MockK
    private lateinit var vc: NodeSyncHook1<ViewController>

    @MockK
    private lateinit var dc: NodeSyncHook1<DataController>

    @MockK
    private lateinit var state: NodeSyncHook1<PlayerFlowState>

    private val hooks by lazy {
        Player.Hooks(node)
    }

    @BeforeEach
    fun setUpMocks() {
        every { node.getObject(any()) } returns node
        every { node.getSerializable<NodeSyncHook1<FlowController>>("flowController", any()) } returns fc
        every { node.getSerializable<NodeSyncHook1<ViewController>>("viewController", any()) } returns vc
        every { node.getSerializable<NodeSyncHook1<DataController>>("dataController", any()) } returns dc
        every { node.getSerializable<NodeSyncHook1<PlayerFlowState>>("state", any()) } returns state
        every { node.nativeReferenceEquals(any()) } returns true
    }

    @Test
    fun flowController() {
        val fc = hooks.flowController
        assertNotNull(fc)
    }

    @Test
    fun viewController() {
        val vc = hooks.viewController
        assertNotNull(vc)
    }

    @Test
    fun dataController() {
        val dc = hooks.dataController
        assertNotNull(dc)
    }

    @Test
    fun state() {
        assertNotNull(hooks.state)
    }
}
