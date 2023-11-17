package com.intuit.player.jvm.core.bridge.hooks

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.view.View
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class NodeSyncHookTest : NodeBaseTest() {
    @MockK
    private lateinit var dummyNode: Node
    @MockK
    private lateinit var invokable: Invokable<Unit>

    private lateinit var map: HashMap<String, Any>
    private lateinit var callback: Invokable<Unit>

    @Suppress("UNCHECKED_CAST")
    @BeforeEach
    fun setUpMock() {
        every { node.getInvokable<Unit>("tap") } returns Invokable {
            map = it[0] as HashMap<String, Any>
            callback = it[1] as Invokable<Unit>
        }
        every { invokable.invoke(*anyVararg()) }
        every { dummyNode.deserialize(View.Serializer) } returns View(dummyNode)
    }

    @Test
    fun `JS Hook Tap On Init`() {
        NodeSyncHook1(node, View.serializer())
        verify { node.getInvokable<Unit>("tap") }
    }

    @Test
    fun `Hook Tap`() {
        var output: View? = null

        val nodeHook = NodeSyncHook1(node, View.serializer())
        nodeHook.tap { view -> output = view }

        callback.invoke(hashMapOf<Any, Any>(), dummyNode)

        verify { node.getInvokable<Unit>("tap") }
        assertEquals(dummyNode, output?.node)
    }

    @Test
    fun `Tap with Context`() {
        var context: HashMap<String, Any>? = null

        val nodeHook = NodeSyncHook1(node, View.serializer())
        nodeHook.tap { map, _ ->
            context = map
        }

        callback.invoke(hashMapOf("first" to 2), dummyNode)

        assertEquals(hashMapOf("first" to 2), context)
    }
}
