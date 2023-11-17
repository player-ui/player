package com.intuit.player.android.reference.demo.test

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.rules.activityScenarioRule
import com.intuit.player.android.reference.demo.test.base.PerformanceTest
import com.intuit.player.android.reference.demo.test.base.waitForViewInRoot
import com.intuit.player.android.reference.demo.ui.main.MainActivity
import org.hamcrest.Matchers.allOf
import org.junit.Rule
import org.junit.Test

class MainActivityTest : PerformanceTest<MainActivity> {

    @get:Rule override val activityRule = activityScenarioRule<MainActivity>()

    @Test
    fun verifyDefault() {
        waitForViewInRoot(withText("Android Reference Assets"))
            .check(matches(isDisplayed()))

        onView(
            allOf(
                withText("Random Mock"),
            ),
        ).perform(click())
    }
}
