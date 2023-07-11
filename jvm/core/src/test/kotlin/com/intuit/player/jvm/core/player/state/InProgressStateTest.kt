package com.intuit.player.jvm.core.player.state

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeFormat
import com.intuit.player.jvm.core.bridge.serialization.format.serializer
import com.intuit.player.jvm.core.bridge.toJson
import com.intuit.player.jvm.core.data.DataController
import com.intuit.player.jvm.core.expressions.ExpressionController
import com.intuit.player.jvm.core.flow.Flow
import com.intuit.player.jvm.core.flow.FlowController
import com.intuit.player.jvm.core.player.PlayerFlowStatus
import com.intuit.player.jvm.core.view.ViewController
import io.mockk.every
import io.mockk.impl.annotations.MockK
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.modules.EmptySerializersModule
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class InProgressStateTest : NodeBaseTest() {

    var lastTransition: String? = null
    private val inProgressState by lazy {
        InProgressState(node)
    }
    private val controllerState by lazy {
        ControllerState(node)
    }

    @MockK
    private lateinit var mockNode: Node

    @MockK
    private lateinit var format: RuntimeFormat<*>

    @BeforeEach
    fun setUpMocks() {
        every { mockNode.getString("name") } returns ""
        every { mockNode.getObject("value") } returns mockNode
        every { mockNode.toJson() } returns JsonPrimitive("")
        every { node.getObject(any()) } returns node
        every { node.getString("ref") } returns "someRef"
        every { node.format } returns format
        every { format.serializersModule } returns EmptySerializersModule
        every { node.getSerializable<Any>("controllers", any()) } returns controllerState
        every { node.getSerializable<Any>("view", any()) } returns ViewController(node)
        every { node.getSerializable<Any>("flow", any()) } returns FlowController(node)
        every { node.getSerializable<Any>("expression", any()) } returns ExpressionController(node)
        every { node.getSerializable<Any>("current", any()) } returns null
        every { node.getSerializable<Any>("currentView", any()) } returns null
        every { node.getSerializable<Any>("data", any()) } returns DataController(node)
        every { node.getFunction<Node>("getCurrentView") } returns null
        every { node.getFunction<Node>("getLastViewUpdate") } returns Invokable { mockNode }
        every { node.getFunction<Node>("getCurrentFlowState") } returns null
        every { node.getObject("flowResult") } returns mockNode
        every { node.getFunction<Unit>("transition") } returns Invokable {
            lastTransition = it[0] as String
        }
        every { node.getSerializable("flow", Flow.serializer()) } returns Flow("flowId")
        every { node.getObject("dataModel") } returns mockNode
        every { node.nativeReferenceEquals(any()) } returns true
    }

    @Test
    fun transition() {
        inProgressState.transition("Next")
        assertEquals("Next", lastTransition)
    }

    @Test
    fun controllers() {
        assertNotNull(inProgressState.controllers)
    }

    @Test
    fun currentView() {
        assertNull(inProgressState.currentView)
    }

    @Test
    fun lastViewUpdate() {
        assertNull(inProgressState.lastViewUpdate)
    }

    @Test
    fun currentFlowState() {
        assertNull(inProgressState.currentFlowState)
    }

    @Test
    fun flowResult() {
        assertNotNull(inProgressState.flowResult)
    }

    @Test
    fun ref() {
        assertEquals("someRef", inProgressState.ref)
    }

    @Test
    fun status() {
        assertEquals(PlayerFlowStatus.IN_PROGRESS, inProgressState.status)
    }

    @Test
    fun flow() {
        assertEquals("flowId", inProgressState.flow.id)
    }

    @Test
    fun dataModel() {
        assertNotNull(inProgressState.dataModel)
    }
}
