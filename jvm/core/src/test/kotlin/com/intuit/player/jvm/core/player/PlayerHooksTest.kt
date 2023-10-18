package com.intuit.player.jvm.core.player

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import io.mockk.every
import io.mockk.impl.annotations.MockK
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class PlayerHooksTest : NodeBaseTest() {
    @MockK
    private lateinit var fc: Node
    @MockK
    private lateinit var vc: Node
    @MockK
    private lateinit var dc: Node
    @MockK
    private lateinit var state: Node

    private val hooks by lazy {
        Player.Hooks(node)
    }

    @BeforeEach
    fun setUpMocks() {
        every { node.getObject("flowController") } returns fc
        every { node.getObject("viewController") } returns vc
        every { node.getObject("dataController") } returns dc
        every { node.getObject("state") } returns state
        every { fc.getFunction<Unit>("tap") } returns Invokable {}
        every { vc.getFunction<Unit>("tap") } returns Invokable {}
        every { dc.getFunction<Unit>("tap") } returns Invokable {}
        every { state.getFunction<Unit>("tap") } returns Invokable {}
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
