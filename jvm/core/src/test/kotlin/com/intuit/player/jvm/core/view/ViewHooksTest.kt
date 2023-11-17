package com.intuit.player.jvm.core.view

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.getInvokable
import io.mockk.every
import io.mockk.impl.annotations.MockK
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class ViewHooksTest : NodeBaseTest() {

    @MockK
    private lateinit var assetNode: Node

    @MockK
    private lateinit var resolver: Node

    private val viewHooks by lazy {
        ViewHooks(node)
    }

    @BeforeEach
    fun setUpMocks() {
        every { node.getObject("onUpdate") } returns assetNode
        every { node.getObject("resolver") } returns resolver
        every { assetNode.getInvokable<Unit>("tap") } returns Invokable {}
        every { resolver.getInvokable<Unit>("tap") } returns Invokable {}
    }

    @Test
    fun onUpdate() {
        assertNotNull(viewHooks.onUpdate)
    }

    @Test
    fun resolver() {
        assertNotNull(viewHooks.resolver)
    }
}
