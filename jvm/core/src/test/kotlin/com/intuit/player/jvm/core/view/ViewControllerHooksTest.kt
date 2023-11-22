package com.intuit.player.jvm.core.view

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncHook1
import io.mockk.every
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

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
