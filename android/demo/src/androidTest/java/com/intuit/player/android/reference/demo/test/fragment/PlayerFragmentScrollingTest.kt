package com.intuit.player.android.reference.demo.test.fragment

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.scrollTo
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.player.android.reference.demo.test.base.AssetUITest
import org.junit.Test

class PlayerFragmentScrollingTest : AssetUITest("misc") {

    @Test
    fun shouldScrollToTopOnTransition() {
        launchMock("long-multi-view")
        onView(withText("Go to view 2")).perform(scrollTo(), click())
        onView(withText("Can you see me?")).check(matches(isDisplayed()))
    }
}
