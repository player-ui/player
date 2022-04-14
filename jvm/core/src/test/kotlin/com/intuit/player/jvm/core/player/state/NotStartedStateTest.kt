package com.intuit.player.jvm.core.player.state

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.player.PlayerFlowStatus
import io.mockk.every
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class NotStartedStateTest : NodeBaseTest() {

    private val notStartedState by lazy {
        NotStartedState(node)
    }

    @BeforeEach
    fun setUpMocks() {
        every { node.getString("ref") } returns "someRef"
    }

    @Test
    fun ref() {
        assertEquals("someRef", notStartedState.ref)
    }

    @Test
    fun status() {
        assertEquals(PlayerFlowStatus.NOT_STARTED, notStartedState.status)
    }
}
