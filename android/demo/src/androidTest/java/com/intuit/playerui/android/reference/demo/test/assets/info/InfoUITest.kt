package com.intuit.playerui.android.reference.demo.test.assets.info

import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.performClick
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.playerui.android.reference.demo.test.base.ComposeUITest
import com.intuit.playerui.android.reference.demo.test.base.shouldBePlayerState
import com.intuit.playerui.android.reference.demo.test.base.waitForViewInRoot
import com.intuit.playerui.core.player.state.InProgressState
import org.junit.Test

class InfoUITest : ComposeUITest("info") {

    enum class Action {
        Next, Dismiss, Continue
    }

    fun verifyView(view: Int) {
        waitForViewInRoot(withText("View $view"))
            .check(matches(isDisplayed()))
    }

    fun verifyAndProceed(view: Int, action: Action? = null, index: Int? = null) {
        verifyView(view)

        action?.let {
            androidComposeRule.onAllNodesWithTag("action").get(index ?: 0)
                .performClick()
        }
    }

    @Test
    fun basic() {
        launchMock("info-modal-flow")

        verifyAndProceed(1, Action.Continue, 0)
        verifyAndProceed(2, Action.Dismiss, 1)
        verifyAndProceed(1, Action.Continue, 0)
        verifyAndProceed(2, Action.Next, 0)
        verifyAndProceed(3, Action.Next, 0)
        verifyView(1)

        currentState.shouldBePlayerState<InProgressState>()
    }
}
