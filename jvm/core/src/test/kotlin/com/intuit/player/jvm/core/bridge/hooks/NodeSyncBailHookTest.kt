package com.intuit.player.jvm.core.bridge.hooks

import com.intuit.hooks.BailResult
import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.view.View
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.verify
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class NodeSyncBailHookTest : NodeBaseTest() {
    @MockK
    private lateinit var dummyNode: Node
    @MockK
    private lateinit var invokable: Invokable<Unit>

    private lateinit var map: HashMap<String, Any>
    private lateinit var callback: Invokable<Any>

    @Suppress("UNCHECKED_CAST")
    @BeforeEach
    fun setUpMock() {
        every { node.getInvokable<Unit>("tap") } returns Invokable {
            map = it[0] as HashMap<String, Any>
            callback = it[1] as Invokable<Any>
        }
        every { invokable.invoke(*anyVararg()) }
        every { dummyNode.deserialize(View.Serializer) } returns View(dummyNode)
    }

    @Test
    fun `JS Hook Tap On Init`() {
        NodeSyncBailHook1<View, Int>(node, View.serializer())
        verify { node.getInvokable<Unit>("tap") }
    }

    @Test
    fun `Hook Tap`() {
        var output: View? = null

        val nodeHook = NodeSyncBailHook1<View, Int>(node, View.serializer())
        nodeHook.tap { view ->
            output = view
            BailResult.Continue()
        }

        val result = callback.invoke(hashMapOf<Any, Any>(), dummyNode)
        Assertions.assertTrue(result == Unit)
        Assertions.assertEquals(dummyNode, output?.node)
    }

    @Test
    fun `Tap with Context`() {
        var context: HashMap<String, Any>? = null

        val nodeHook = NodeSyncBailHook1<View, Int>(node, View.serializer())
        nodeHook.tap { map, _ ->
            context = map
            BailResult.Continue()
        }

        callback.invoke(hashMapOf("first" to 2), dummyNode)

        Assertions.assertEquals(hashMapOf("first" to 2), context)
    }

    @Test
    fun `Tap with Bail result, subsequent taps not called`() {
        var secondTapCalled = false
        val nodeHook = NodeSyncBailHook1<View, Int>(node, View.serializer())
        nodeHook.tap { _ ->
            BailResult.Bail(1)
        }
        nodeHook.tap { _ ->
            secondTapCalled = true
            BailResult.Continue()
        }
        val result = callback.invoke(hashMapOf<Any, Any>(), dummyNode)
        Assertions.assertTrue(result == 1)
        Assertions.assertFalse(secondTapCalled)
    }

    @Test
    fun `Tap with Continue result, subsequent taps called`() {
        var secondTapCalled = false
        val nodeHook = NodeSyncBailHook1<View, Int>(node, View.serializer())
        nodeHook.tap { _ ->
            BailResult.Continue()
        }
        nodeHook.tap { _ ->
            secondTapCalled = true
            BailResult.Continue()
        }
        callback.invoke(hashMapOf<Any, Any>(), dummyNode)
        Assertions.assertTrue(secondTapCalled)
    }
}
