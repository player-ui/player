package com.intuit.player.jvm.core.data

import com.intuit.player.jvm.core.player.state.InProgressState
import com.intuit.player.jvm.core.player.state.dataModel
import com.intuit.player.jvm.utils.test.PlayerTest
import com.intuit.player.jvm.utils.test.simpleFlowString
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.TestTemplate

internal class DataControllerIntegrationTest : PlayerTest() {

    @TestTemplate
    fun `test data controller from state`() {
        player.start(simpleFlowString)
        val state = player.state as InProgressState

        // test helper
        state.dataModel.set("count" to 40)
        assertEquals(40, state.dataModel.get("count"))

        state.dataModel.set(listOf(listOf("count", 80)))
        assertEquals(80, state.dataModel.get("count"))
    }
}
