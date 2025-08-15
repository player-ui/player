package com.intuit.playerui.core.view

import com.intuit.playerui.core.NodeBaseTest
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook1
import io.mockk.every
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertEquals

internal class ViewControllerHooksTest : NodeBaseTest() {

    private val view by lazy {
        NodeSyncHook1(node, View.serializer())
    }

    @BeforeEach
    fun setUpMock() {
        every { node.getObject("view") } returns node
        every { node.getInvokable<Any?>("tap") } returns Invokable {}
        every { node.getInvokable<Any?>("tap", any()) } returns Invokable {}
        every { node.getSerializable<NodeSyncHook1<View>>("view", any()) } returns view
        every { node.nativeReferenceEquals(any()) } returns false
    }

    @Test
    fun view() {
        val viewControllerHooks = ViewController.Hooks(node)
        assertEquals(viewControllerHooks.view, view)
    }
}
