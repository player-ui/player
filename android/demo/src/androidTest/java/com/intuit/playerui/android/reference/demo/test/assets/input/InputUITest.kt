package com.intuit.playerui.android.reference.demo.test.assets.input

import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.pressImeActionButton
import androidx.test.espresso.action.ViewActions.typeText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withChild
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.playerui.android.reference.demo.R
import com.intuit.playerui.android.reference.demo.test.base.AssetUITest
import com.intuit.playerui.android.reference.demo.test.base.shouldBeAtState
import com.intuit.playerui.android.reference.demo.test.base.waitForViewInRoot
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.dataModel
import org.hamcrest.Matcher
import org.hamcrest.Matchers.allOf
import org.junit.Assert.assertEquals
import org.junit.Test

class InputUITest : AssetUITest("input") {

    fun verifyIsDisplayed(matcher: Matcher<View>) = waitForViewInRoot(matcher)
        .check(matches(isDisplayed()))

    @Test
    fun basic() {
        launchMock("input-basic")

        waitForViewInRoot(withText("This is an input"))
            .check(matches(isDisplayed()))

        onView(withId(R.id.input_field))
            .check(matches(isDisplayed()))
            .perform(click())
            .perform(typeText("text"))
            .perform(pressImeActionButton())

        player.shouldBeAtState<InProgressState> {
            assertEquals("text", dataModel.get("foo.bar"))
        }
    }

    @Test
    fun transitionValidation() {
        launchMock("input-transition")

        verifyIsDisplayed(
            allOf(
                withId(R.id.input_label_container),
                withChild(withText("Input with validation and formatting")),
            ),
        )

        verifyIsDisplayed(
            allOf(
                withId(R.id.input_note_container),
                withChild(withText("It expects a positive integer")),
            ),
        )

        onView(withId(R.id.input_field))
            .perform(typeText("t"))
            .perform(pressImeActionButton())

        player.shouldBeAtState<InProgressState> {
            assertEquals(null, dataModel.get("foo.bar"))
        }

        onView(withId(R.id.input_field))
            .perform(typeText("30"))
            .perform(pressImeActionButton())

        player.shouldBeAtState<InProgressState> {
            assertEquals(30, dataModel.get("foo.bar"))
        }
    }
}
