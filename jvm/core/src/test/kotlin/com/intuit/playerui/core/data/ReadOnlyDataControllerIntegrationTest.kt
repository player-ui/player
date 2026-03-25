package com.intuit.playerui.core.data

import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.TestTemplate

internal class ReadOnlyDataControllerIntegrationTest : PlayerTest() {
    private val flowWithData =
"""
{
  "id": "read-only-data-test",
  "views": [
    {
      "id": "view-1",
      "type": "action",
      "label": {
        "asset": {
          "id": "action-label",
          "type": "text",
          "value": "Continue"
        }
      }
    }
  ],
  "data": {
    "name": "Player",
    "count": 10
  },
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "view-1",
        "transitions": {
          "*": "END_Done"
        }
      },
      "END_Done": {
        "state_type": "END",
        "outcome": "done"
      }
    }
  }
}
""".trimIndent()

    @TestTemplate
    fun `completed state exposes read-only data controller`() = runBlockingTest {
        val completable = player.start(flowWithData)

        (player.state as InProgressState).transition("Next")

        val completedState = completable.await()
        assertNotNull(completedState.dataModel)
        assertEquals(ReadOnlyDataController::class, completedState.dataModel::class)
    }

    @TestTemplate
    fun `read-only data controller returns correct values after completion`() = runBlockingTest {
        val completable = player.start(flowWithData)

        (player.state as InProgressState).transition("Next")

        val completedState = completable.await()
        assertEquals("Player", completedState.dataModel.get("name"))
        assertEquals(10, completedState.dataModel.get("count"))
    }

    @TestTemplate
    fun `read-only data controller get convenience returns full data model`() = runBlockingTest {
        val completable = player.start(flowWithData)

        (player.state as InProgressState).transition("Next")

        val completedState = completable.await()
        val allData = completedState.dataModel.get()
        assertNotNull(allData)
        assertEquals("Player", allData["name"])
    }
}
