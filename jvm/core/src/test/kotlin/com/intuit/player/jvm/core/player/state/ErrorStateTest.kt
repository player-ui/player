package com.intuit.player.jvm.core.player.state

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.flow.Flow
import com.intuit.player.jvm.core.player.PlayerException
import com.intuit.player.jvm.core.player.PlayerFlowStatus
import io.mockk.every
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
        every { node.getString("ref") } returns "someRef"
        every { node.getSerializable("flow", Flow.serializer()) } returns Flow("flowId")
        every { node.getSerializable("error", any<KSerializer<Throwable>>()) } returns null
        every { node.getString("error") } returns "hello"
    }

    @Test
    fun errorFromObject() {
        val someException = PlayerException("yooo")
        every { node.getSerializable("error", any<KSerializer<Throwable>>()) } returns someException
        assertEquals(someException, errorState.error)
    }

    @Test
    fun errorFromString() {
        assertEquals("hello", errorState.error.message)
    }

    @Test
    fun ref() {
        assertEquals("someRef", errorState.ref)
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
