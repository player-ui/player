package com.intuit.playerui.core.player.state

import com.intuit.playerui.core.NodeBaseTest
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.flow.Flow
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.PlayerFlowStatus
import io.mockk.every
import io.mockk.mockk
import kotlinx.serialization.KSerializer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class ErrorStateTest : NodeBaseTest() {
    private val errorState by lazy {
        ErroneousState(node)
    }

    @BeforeEach
    fun setUpMocks() {
        val runtime: Runtime<*> = mockk()
        every { node.runtime } returns runtime
        every { runtime.containsKey("getSymbol") } returns true
        every { runtime.getInvokable<String?>("getSymbol") } returns Invokable { "Symbol(hello)" }
        every { node.getSerializable("flow", Flow.serializer()) } returns Flow("flowId")
        every { node.getSerializable("error", any<KSerializer<Throwable>>()) } returns null
        every { node.getString("error") } returns "hello"
        every { node.getObject("error") } returns null
        every { node.getObject("flow") } returns null
        every { node.nativeReferenceEquals(any()) } returns false
    }

    @Test
    fun errorFromObject() {
        val someException = PlayerException("hello")

        every { node.getSerializable("error", any<KSerializer<Throwable>>()) } returns someException

        assertEquals(someException, errorState.error)
    }

    @Test
    fun errorFromString() {
        val message = "hello"
        every { node["error"] } returns message
        assertEquals(message, errorState.error.message)
    }

    @Test
    fun ref() {
        assertEquals("Symbol(hello)", errorState.ref)
    }

    @Test
    fun status() {
        assertEquals(PlayerFlowStatus.ERROR, errorState.status)
    }

    @Test
    fun flow() {
        assertEquals("flowId", errorState.flow.id)
    }
}
