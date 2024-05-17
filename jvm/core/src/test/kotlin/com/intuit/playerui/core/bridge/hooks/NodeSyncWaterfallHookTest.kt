package com.intuit.playerui.core.bridge.hooks

import com.intuit.playerui.core.NodeBaseTest
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.view.View
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.verify
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class NodeSyncWaterfallHookTest : NodeBaseTest() {
    @MockK
    private lateinit var dummyNode: Node

    @MockK
    private lateinit var invokable: Invokable<Unit>

    private lateinit var map: HashMap<String, Any>
    private lateinit var callback: Invokable<Any?>

    private val mapSerializer = MapSerializer(String.serializer(), GenericSerializer())

    @Suppress("UNCHECKED_CAST")
    @BeforeEach
    fun setUpMock() {
        val callback = Invokable<Any?> {
            map = it[0] as HashMap<String, Any>
            callback = it[1] as Invokable<Any?>
        }
        every { node.getInvokable<Any?>("tap") } returns callback
        every { node.getInvokable<Any?>("tap", any()) } returns callback
        every { invokable.invoke(*anyVararg()) }
        every { dummyNode.deserialize(View.Serializer) } returns View(dummyNode)
        every { dummyNode.deserialize(mapSerializer) } returns mapOf("key" to "value")
    }

    @Test
    fun `JS Hook Tap On Init`() {
        NodeSyncWaterfallHook1(node, View.serializer())
        verify { node.getInvokable<Any?>("tap", any()) }
    }

    @Test
    fun `Hook Tap`() {
        var output: View? = null

        val nodeHook = NodeSyncWaterfallHook1(node, View.serializer())
        nodeHook.tap { view ->
            output = view
            view
        }

        callback.invoke(hashMapOf<Any, Any>(), dummyNode)

        verify { node.getInvokable<Any?>("tap", any()) }
        assertEquals(dummyNode, output?.node)
    }

    @Test
    fun `can change the map supplied via tap`() {
        val nodeHook = NodeSyncWaterfallHook1(node, mapSerializer)
        nodeHook.tap { input ->
            (input ?: emptyMap()) + mapOf("anotherKey" to "anotherValue")
        }

        val result = callback.invoke(hashMapOf<Any, Any>(), dummyNode)

        verify { node.getInvokable<Any?>("tap", any()) }
        assertEquals(mapOf("key" to "value", "anotherKey" to "anotherValue"), result)
    }

    @Test
    fun `Tap with Context`() {
        var context: HashMap<String, Any>? = null

        val nodeHook = NodeSyncWaterfallHook1(node, View.serializer())
        nodeHook.tap { map, view ->
            context = map
            view
        }

        callback.invoke(hashMapOf("first" to 2), dummyNode)

        assertEquals(hashMapOf("first" to 2), context)
    }
}
