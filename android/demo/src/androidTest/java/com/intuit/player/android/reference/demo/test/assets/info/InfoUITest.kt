package com.intuit.player.android.reference.demo.test.assets.info

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.player.android.reference.demo.test.base.AssetUITest
import com.intuit.player.android.reference.demo.test.base.shouldBePlayerState
import com.intuit.player.jvm.core.player.state.InProgressState
import org.junit.Test

class InfoUITest : AssetUITest("info") {

    enum class Action {
        Next, Dismiss
    }

    fun verifyView(view: Int) {
        eyes.checkPlayer("View $view")
        onView(withText("View $view"))
            .check(matches(isDisplayed()))
    }

    fun verifyAndProceed(view: Int, action: Action? = null) {
        verifyView(view)

        action?.let {
            onView(withText(action.name))
                .check(matches(isDisplayed()))
                .perform(click())
        }
    }

    @Test
    fun basic() {
        launchMock("modal-flow")

        verifyAndProceed(1, Action.Next)
        verifyAndProceed(2, Action.Dismiss)
        verifyAndProceed(1, Action.Next)
        verifyAndProceed(2, Action.Next)
        verifyAndProceed(3, Action.Next)
        verifyView(1)

        currentState.shouldBePlayerState<InProgressState>()
    }
}
