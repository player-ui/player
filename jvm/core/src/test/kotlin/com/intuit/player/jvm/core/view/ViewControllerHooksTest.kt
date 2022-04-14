package com.intuit.player.jvm.core.view

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import io.mockk.every
import io.mockk.impl.annotations.MockK
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class ViewControllerHooksTest : NodeBaseTest() {

    @MockK
    private lateinit var view: Node

    @BeforeEach
    fun setUpMock() {
        every { node.getObject("view") } returns view
        every { view.getFunction<Unit>("tap") } returns Invokable {}
    }

    @Test
    fun view() {
        val viewControllerHooks = ViewController.Hooks(node)
        assertNotNull(viewControllerHooks.view)
    }
}
