package com.intuit.playerui.android.reference.demo.test

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.rules.activityScenarioRule
import com.intuit.playerui.android.reference.demo.test.base.PerformanceTest
import com.intuit.playerui.android.reference.demo.test.base.waitForViewInRoot
import com.intuit.playerui.android.reference.demo.ui.main.MainActivity
import org.junit.Rule
import org.junit.Test

class MainActivityTest : PerformanceTest<MainActivity> {

    @get:Rule override val activityRule = activityScenarioRule<MainActivity>()

    @get:Rule
    val androidComposeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun verifyDefault() {
        waitForViewInRoot(withText("Android Reference Assets"))
            .check(matches(isDisplayed()))

        androidComposeRule.onNodeWithTag("action")
            .performClick()
    }
}
