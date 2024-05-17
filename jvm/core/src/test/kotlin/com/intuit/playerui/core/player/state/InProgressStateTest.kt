package com.intuit.playerui.core.player.state

import com.intuit.playerui.core.NodeBaseTest
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.serialization.format.RuntimeFormat
import com.intuit.playerui.core.bridge.toJson
import com.intuit.playerui.core.data.DataController
import com.intuit.playerui.core.data.DataModelWithParser
import com.intuit.playerui.core.expressions.ExpressionController
import com.intuit.playerui.core.flow.Flow
import com.intuit.playerui.core.flow.FlowController
import com.intuit.playerui.core.player.PlayerFlowStatus
import com.intuit.playerui.core.view.ViewController
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.modules.EmptySerializersModule
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
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
        every { node["flow"] } returns node
        val runtime: Runtime<*> = mockk()
        every { node.runtime } returns runtime
        every { runtime.containsKey("getSymbol") } returns true
        every { runtime.getInvokable<String?>("getSymbol") } returns Invokable { "Symbol(hello)" }
        every { node.format } returns format
        every { format.serializersModule } returns EmptySerializersModule
        every { node.getSerializable<Any>("controllers", any()) } returns controllerState
        every { node.getSerializable<Any>("view", any()) } returns ViewController(node)
        every { node.getSerializable<Any>("flow", any()) } returns FlowController(node)
        every { node.getSerializable<Any>("expression", any()) } returns ExpressionController(node)
        every { node.getSerializable<Any>("current", any()) } returns null
        every { node.getSerializable<Any>("currentView", any()) } returns null
        every { node.getSerializable<Any>("data", any()) } returns DataController(node)
        every { node.getInvokable<Node>("getCurrentView") } returns null
        every { node.getInvokable<Node>("getLastViewUpdate") } returns Invokable { mockNode }
        every { node.getInvokable<Node>("getCurrentFlowState") } returns null
        every { node.getObject("flowResult") } returns mockNode
        every { node.getInvokable<Unit>("transition") } returns Invokable {
            lastTransition = it[0] as String
        }
        every { node.getSerializable("flow", Flow.serializer()) } returns Flow("flowId")
        every { node.getSerializable("dataModel", DataModelWithParser.serializer()) } returns DataModelWithParser(node)
        every { node.nativeReferenceEquals(any()) } returns false
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
        assertEquals("Symbol(hello)", inProgressState.ref)
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
