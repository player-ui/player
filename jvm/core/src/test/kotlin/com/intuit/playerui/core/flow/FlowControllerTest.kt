package com.intuit.playerui.core.flow

import com.intuit.playerui.core.NodeBaseTest
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.getInvokable
import io.mockk.every
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class FlowControllerTest : NodeBaseTest() {
    val flowController by lazy {
        FlowController(node)
    }

    var lastTransition: String? = null

    @Test
    fun transition() {
        every { node.getInvokable<Unit>("transition") } returns Invokable {
            lastTransition = it[0] as String
        }
        flowController.transition("Next")
        assertEquals("Next", lastTransition)
    }
}
