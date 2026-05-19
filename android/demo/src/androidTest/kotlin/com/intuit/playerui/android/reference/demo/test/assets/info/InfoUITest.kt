package com.intuit.playerui.android.reference.demo.test.assets.info

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.playerui.android.reference.demo.test.base.ComposeUITest
import com.intuit.playerui.android.reference.demo.test.base.waitForViewInRoot
import com.intuit.playerui.android.testutils.asset.shouldBeAtState
import com.intuit.playerui.core.player.state.InProgressState
import org.junit.Test

class InfoUITest : ComposeUITest("info") {
    enum class Action(
        val label: String,
    ) {
        Next("Next"),
        Dismiss("Dismiss"),
        Continue("Continue"),
    }

    fun verifyView(view: Int) {
        waitForViewInRoot(withText("View $view"))
            .check(matches(isDisplayed()))
    }

    fun verifyAndProceed(view: Int, action: Action? = null) {
        verifyView(view)

        action?.let {
            waitForViewInRoot(withText(it.label))
            onView(withText(it.label)).perform(click())
        }
    }

    @Test
    fun basic() {
        launchMock("info-modal-flow")

        verifyAndProceed(1, Action.Continue)
        verifyAndProceed(2, Action.Dismiss)
        verifyAndProceed(1, Action.Continue)
        verifyAndProceed(2, Action.Next)
        verifyAndProceed(3, Action.Next)
        verifyView(1)

        player.shouldBeAtState<InProgressState>()
    }
}
