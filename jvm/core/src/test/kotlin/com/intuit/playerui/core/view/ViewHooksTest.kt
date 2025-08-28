package com.intuit.playerui.core.view

import com.intuit.playerui.core.NodeBaseTest
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook1
import com.intuit.playerui.core.resolver.Resolver
import io.mockk.every
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class ViewHooksTest : NodeBaseTest() {
    private val onUpdate by lazy {
        NodeSyncHook1(node, Asset.serializer())
    }

    private val resolver by lazy {
        NodeSyncHook1(node, Resolver.serializer())
    }

    private val viewHooks by lazy {
        ViewHooks(node)
    }

    @BeforeEach
    fun setUpMocks() {
        every { node.getObject("onUpdate") } returns node
        every { node.getObject("resolver") } returns node
        every { node.getInvokable<Any?>("tap") } returns Invokable {}
        every { node.getInvokable<Any?>("tap", any()) } returns Invokable {}
        every { node.getSerializable<NodeSyncHook1<Asset>>("onUpdate", any()) } returns onUpdate
        every { node.getSerializable<NodeSyncHook1<Resolver>>("resolver", any()) } returns resolver
        every { node.nativeReferenceEquals(any()) } returns false
    }

    @Test
    fun onUpdate() {
        assertEquals(viewHooks.onUpdate, onUpdate)
    }

    @Test
    fun resolver() {
        assertEquals(viewHooks.resolver, resolver)
    }
}
