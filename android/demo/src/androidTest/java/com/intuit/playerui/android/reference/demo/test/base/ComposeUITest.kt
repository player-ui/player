package com.intuit.playerui.android.reference.demo.test.base

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.intuit.playerui.android.reference.demo.ui.main.MainActivity
import org.junit.Rule

abstract class ComposeUITest(group: String? = null) : AssetUITest(group) {
    @get:Rule
    val androidComposeRule = createAndroidComposeRule<MainActivity>()

    override fun getActivityRule(): ActivityScenarioRule<MainActivity> {
        return androidComposeRule.activityRule
    }
}
