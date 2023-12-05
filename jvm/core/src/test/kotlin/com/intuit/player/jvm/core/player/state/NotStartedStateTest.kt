package com.intuit.player.jvm.core.player.state

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.player.PlayerFlowStatus
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class NotStartedStateTest : NodeBaseTest() {

    private val notStartedState by lazy {
        NotStartedState(node)
    }

    @BeforeEach
    fun setUpMocks() {
        val runtime: Runtime<*> = mockk()
        every { node.runtime } returns runtime
        every { runtime.containsKey("getSymbol") } returns true
        every { runtime.getInvokable<String?>("getSymbol") } returns Invokable { "Symbol(hello)" }
    }

    @Test
    fun ref() {
        assertEquals("Symbol(hello)", notStartedState.ref)
    }

    @Test
    fun status() {
        assertEquals(PlayerFlowStatus.NOT_STARTED, notStartedState.status)
    }
}
