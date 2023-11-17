package com.intuit.player.jvm.core.view

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncHook1
import com.intuit.player.jvm.core.resolver.Resolver
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
        every { node.getInvokable<Unit>("tap") } returns Invokable {}
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
