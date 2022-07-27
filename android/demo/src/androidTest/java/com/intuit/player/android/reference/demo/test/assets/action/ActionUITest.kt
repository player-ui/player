package com.intuit.player.android.reference.demo.test.assets.action

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.player.android.reference.demo.test.base.AssetUITest
import com.intuit.player.android.reference.demo.test.base.shouldBePlayerState
import com.intuit.player.jvm.core.player.state.CompletedState
import com.intuit.player.jvm.core.player.state.ErrorState
import com.intuit.player.jvm.core.player.state.InProgressState
import com.intuit.player.jvm.core.player.state.dataModel
import org.junit.Assert.assertEquals
import org.junit.Test

class ActionUITest : AssetUITest("action") {

    @Test
    fun basic() {
        launchMock()

        repeat(10) {
            onView(withText("Count: $it"))
                .check(matches(isDisplayed()))
                .perform(click())

            eyes.checkPlayer("click $it")
        }

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals(10, dataModel.get("count"))
        }
    }

    @Test
    fun transitionToEndSuccess() {
        launchMock("transition-to-end")

        onView(withText("End the flow (success)"))
            .check(matches(isDisplayed()))
            .perform(click())

        currentState.shouldBePlayerState<CompletedState> {
            assertEquals("done", endState.outcome)
        }
    }

    @Test
    fun transitionToEndError() {
        launchMock("transition-to-end")

        onView(withText("End the flow (error)"))
            .check(matches(isDisplayed()))
            .perform(click())

        currentState.shouldBePlayerState<ErrorState> {
            assertEquals("Error: Unclosed brace after \"foo.bar..}\" at character 12", error.message)
        }
    }
}
