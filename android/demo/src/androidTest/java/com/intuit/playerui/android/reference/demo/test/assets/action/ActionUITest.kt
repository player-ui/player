package com.intuit.playerui.android.reference.demo.test.assets.action

import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.playerui.android.reference.demo.test.base.AssetUITest
import com.intuit.playerui.android.reference.demo.test.base.shouldBePlayerState
import com.intuit.playerui.android.reference.demo.test.base.waitForViewInRoot
import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.dataModel
import org.junit.Assert.assertEquals
import org.junit.Test

class ActionUITest : AssetUITest("reference-assets") {

    @Test
    fun basic() {
        launchMock("action-basic")

        repeat(10) {
            waitForViewInRoot(withText("Count: $it"))
                .perform(click())

            waitForViewInRoot(withText("Count: ${it + 1}"))
        }

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals(10, dataModel.get("count"))
        }
    }

    @Test
    fun transitionToEndSuccess() {
        launchMock("action-transition-to-end")

        waitForViewInRoot(withText("End the flow (success)"))
            .check(matches(isDisplayed()))
            .perform(click())

        currentState.shouldBePlayerState<CompletedState> {
            assertEquals("DONE", endState.outcome)
        }
    }

    @Test
    fun transitionToEndError() {
        launchMock("action-transition-to-end")

        waitForViewInRoot(withText("End the flow (error)"))
            .check(matches(isDisplayed()))
            .perform(click())

        currentState.shouldBePlayerState<ErrorState> {
            assertEquals("Error: Unclosed brace after \"foo.bar..}\" at character 12", error.message)
        }
    }
}
