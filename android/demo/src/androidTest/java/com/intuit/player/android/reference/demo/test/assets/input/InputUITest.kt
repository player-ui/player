package com.intuit.player.android.reference.demo.test.assets.input

import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.clearText
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.pressImeActionButton
import androidx.test.espresso.action.ViewActions.typeText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.hasErrorText
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withChild
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withParent
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.player.android.reference.demo.R
import com.intuit.player.android.reference.demo.test.base.AssetUITest
import com.intuit.player.android.reference.demo.test.base.shouldBePlayerState
import com.intuit.player.jvm.core.player.state.InProgressState
import com.intuit.player.jvm.core.player.state.dataModel
import org.hamcrest.Matcher
import org.hamcrest.Matchers.allOf
import org.junit.Assert.assertEquals
import org.junit.Test

class InputUITest : AssetUITest("input") {

    fun verifyIsDisplayed(matcher: Matcher<View>) = onView(matcher)
        .check(matches(isDisplayed()))

    @Test
    fun basic() {
        launchMock()

        onView(withText("This is an input"))
            .check(matches(isDisplayed()))

        onView(withId(R.id.input_field))
            .check(matches(isDisplayed()))
            .perform(click())
            .perform(typeText("text"))
            .perform(pressImeActionButton())

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals("text", dataModel.get("foo.bar"))
        }
    }

    @Test
    fun validationAgeFormatter() {
        launchMock("validation")

        val ageContainer = allOf(
            withId(R.id.input_container),
            withChild(withChild(withText("Age")))
        ).also(::verifyIsDisplayed)

        val ageInput = allOf(
            withId(R.id.input_field),
            withParent(ageContainer)
        ).also(::verifyIsDisplayed)

        onView(ageInput)
            .perform(typeText("text"))
            .perform(pressImeActionButton())

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals("", dataModel.get("person.age"))
        }

        eyes.checkPlayer("invalid-age")

        onView(ageInput)
            .perform(typeText("30"))
            .perform(pressImeActionButton())

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals(30, dataModel.get("person.age"))
        }
    }

    @Test
    fun validationName() {
        launchMock("validation")

        val nameContainer = allOf(
            withId(R.id.input_container),
            withChild(withChild(withText("Name")))
        ).also(::verifyIsDisplayed)

        val nameInput = allOf(
            withId(R.id.input_field),
            withParent(nameContainer)
        ).also(::verifyIsDisplayed)

        onView(nameInput)
            .perform(typeText("more than 10 characters"))
            .perform(pressImeActionButton())
            .check(matches(hasErrorText("Up to 10 characters allowed")))

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals("", dataModel.get("person.name"))
        }

        eyes.checkPlayer("upper-limit-validation")

        onView(nameInput)
            .perform(click())
            .perform(clearText())
            .perform(pressImeActionButton())
            .check(matches(hasErrorText("At least 1 characters needed")))

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals("", dataModel.get("person.name"))
        }

        eyes.checkPlayer("lower-limit-validation")

        onView(nameInput)
            .perform(typeText("Jeremiah"))
            .perform(pressImeActionButton())

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals("Jeremiah", dataModel.get("person.name"))
        }
    }
}
