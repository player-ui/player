package com.intuit.playerui.core.player.state

import com.intuit.playerui.core.NodeBaseTest
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.serialization.format.RuntimeFormat
import com.intuit.playerui.core.data.DataController
import com.intuit.playerui.core.data.DataModelWithParser
import com.intuit.playerui.core.flow.Flow
import com.intuit.playerui.core.player.PlayerFlowStatus
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import kotlinx.serialization.modules.EmptySerializersModule
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class CompletedStateTest : NodeBaseTest() {
    private val completedState by lazy {
        CompletedState(node)
    }

    private val controllerState by lazy {
        ControllerState(node)
    }

    @MockK
    private lateinit var mockDataModel: Node

    @MockK
    private lateinit var format: RuntimeFormat<*>

    @BeforeEach
    fun setUpMocks() {
        val runtime: Runtime<*> = mockk()
        every { node.runtime } returns runtime
        every { node.format } returns format
        every { format.serializersModule } returns EmptySerializersModule
        every { runtime.containsKey("getSymbol") } returns true
        every { runtime.getInvokable<String?>("getSymbol") } returns Invokable { "Symbol(hello)" }
        every { node.getObject("controllers") } returns node
        every { node.getSerializable<Any>("controllers", any()) } returns controllerState
        every { node.getObject("data") } returns node
        every { node.getSerializable<Any>("data", any()) } returns DataController(node)
        every { node.getSerializable("flow", Flow.serializer()) } returns Flow("flowId")
        every { node.getSerializable("dataModel", DataModelWithParser.serializer()) } returns DataModelWithParser(node)
        every { node.getObject("dataModel") } returns mockDataModel
        every { node.getObject("flow") } returns null
        every { node.nativeReferenceEquals(any()) } returns false
    }

    @Test
    fun ref() {
        assertEquals("Symbol(hello)", completedState.ref)
    }

    @Test
    fun status() {
        assertEquals(PlayerFlowStatus.COMPLETED, completedState.status)
    }

    @Test
    fun flow() {
        assertEquals("flowId", completedState.flow.id)
    }

    @Test
    fun dataModel() {
        assertNotNull(completedState.dataModel)
    }
}
