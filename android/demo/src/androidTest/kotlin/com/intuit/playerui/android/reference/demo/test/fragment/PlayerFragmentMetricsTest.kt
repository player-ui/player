package com.intuit.playerui.android.reference.demo.test.fragment

import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withSubstring
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.playerui.android.reference.demo.test.base.ComposeUITest
import com.intuit.playerui.android.reference.demo.test.base.waitForViewInRoot
import com.intuit.playerui.plugins.metrics.metricsPlugin
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PlayerFragmentMetricsTest : ComposeUITest() {
    @Test
    fun rendersEndFiresOnViewTransition() {
        launchMock("long-multi-view")

        waitForViewInRoot(withSubstring("It was the best of times")).check(matches(isDisplayed()))

        var renderEndCount = 0
        player.metricsPlugin?.hooks?.onRenderEnd?.tap("test") { _, _, _ ->
            renderEndCount++
        }

        androidComposeRule.onNodeWithTag("action").performClick()
        waitForViewInRoot(withText("Can you see me?"))
            .check(matches(isDisplayed()))

        assertTrue("renderEnd should fire when transitioning to the next view", renderEndCount >= 1)
    }

    @Test
    fun rendersEndFiresOnSameViewUpdate() {
        launchMock("action-basic")

        var onUpdateEndTapped = false
        player.metricsPlugin?.hooks?.onUpdateEnd?.tap("test") { _, _, _ ->
            onUpdateEndTapped = true
        }

        waitForViewInRoot(withText("Count: 0")).check(matches(isDisplayed()))
        assertFalse(onUpdateEndTapped)

        androidComposeRule.onNodeWithTag("action").performClick()
        waitForViewInRoot(withText("Count: 1")).check(matches(isDisplayed()))

        assertTrue(onUpdateEndTapped)
    }
}
