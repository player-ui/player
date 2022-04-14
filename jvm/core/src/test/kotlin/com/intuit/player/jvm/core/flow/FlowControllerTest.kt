package com.intuit.player.jvm.core.flow

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Invokable
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
        every { node.getFunction<Unit>("transition") } returns Invokable {
            lastTransition = it[0] as String
        }
        flowController.transition("Next")
        assertEquals("Next", lastTransition)
    }
}
