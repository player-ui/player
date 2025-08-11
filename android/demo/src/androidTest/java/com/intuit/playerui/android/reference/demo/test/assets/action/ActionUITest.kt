package com.intuit.playerui.android.reference.demo.test.assets.action

import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.playerui.android.reference.demo.test.base.ComposeUITest
import com.intuit.playerui.android.reference.demo.test.base.shouldBeAtState
import com.intuit.playerui.android.reference.demo.test.base.waitForViewInRoot
import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.dataModel
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class ActionUITest : ComposeUITest("action") {
    @Test
    fun basic() {
        launchMock("action-basic")

        repeat(10) {
            waitForViewInRoot(withText("Count: $it"))
                .check(matches(isDisplayed()))
            androidComposeRule.onNodeWithTag("action").performClick()

            waitForViewInRoot(withText("Count: ${it + 1}"))
                .check(matches(isDisplayed()))
        }

        player.shouldBeAtState<InProgressState> {
            assertEquals(10, dataModel.get("count"))
        }
    }

    @Test
    fun transitionToEndSuccess() {
        launchMock("action-transition-to-end")

        waitForViewInRoot(withText("End the flow (success)"))
            .check(matches(isDisplayed()))
        androidComposeRule
            .onAllNodesWithTag("action")
            .get(0)
            .performClick()
        player.shouldBeAtState<CompletedState> {
            assertEquals("done", endState.outcome)
        }
    }

    @Test
    fun transitionToEndError() {
        launchMock("action-transition-to-end")
        runTest {
            waitForViewInRoot(withText("End the flow (error)"))
                .check(matches(isDisplayed()))
            androidComposeRule
                .onAllNodesWithTag("action")
                .get(1)
                .performClick()
            player.shouldBeAtState<ErrorState> {
                assertEquals("Error: Unclosed brace after \"foo.bar..}\" at character 12", error.message)
            }
        }
    }
}
