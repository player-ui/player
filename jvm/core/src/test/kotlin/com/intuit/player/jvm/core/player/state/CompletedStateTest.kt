package com.intuit.player.jvm.core.player.state

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.getSerializable
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeFormat
import com.intuit.player.jvm.core.data.DataModelWithParser
import com.intuit.player.jvm.core.expressions.ExpressionController
import com.intuit.player.jvm.core.flow.Flow
import com.intuit.player.jvm.core.flow.FlowController
import com.intuit.player.jvm.core.player.PlayerFlowStatus
import com.intuit.player.jvm.core.view.ViewController
import io.mockk.every
import io.mockk.impl.annotations.MockK
import kotlinx.serialization.modules.EmptySerializersModule
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class CompletedStateTest : NodeBaseTest() {

    private val completedState by lazy {
        CompletedState(node)
    }

    @MockK
    private lateinit var mockDataModel: Node

    @MockK
    private lateinit var format: RuntimeFormat<*>

    @BeforeEach
    fun setUpMocks() {
        every { node.getString("ref") } returns "someRef"
        every { node.format } returns format
        every { format.serializersModule } returns EmptySerializersModule
        every { node.getSerializable<Any>("controllers", any()) } returns ControllerState(node)
        every { node.getSerializable<Any>("view", any()) } returns ViewController(node)
        every { node.getSerializable<Any>("flow", any()) } returns FlowController(node)
        every { node.getSerializable<Any>("flow", any()) } returns FlowController(node)
        every { node.getSerializable<Any>("expression", any()) } returns ExpressionController(node)
        every { node.getSerializable("flow", Flow.serializer()) } returns Flow("flowId")
        every { node.getSerializable<Any>("dataModel", any()) } returns DataModelWithParser(node)
    }

    @Test
    fun ref() {
        assertEquals("someRef", completedState.ref)
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
