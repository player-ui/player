package com.intuit.playerui.android.reference.demo.test.base

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.ComposeTestRule
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

    // From androidx.compose.ui:ui-test:1.4.0
    // https://android.googlesource.com/platform/frameworks/support/+/androidx-main/compose/ui/ui-test/src/commonMain/kotlin/androidx/compose/ui/test/ComposeUiTest.kt#207
    fun ComposeTestRule.waitUntilNodeCount(
        matcher: SemanticsMatcher,
        count: Int,
        timeoutMillis: Long = 1_000L,
    ) = waitUntil(timeoutMillis) {
        // Never require the existence of compose roots. Either the current UI or the anticipated UI
        // might not have any compose at all (i.e. View only).
        onAllNodes(matcher).fetchSemanticsNodes(atLeastOneRootRequired = false).size == count
    }

    fun ComposeTestRule.waitUntilAtLeastOneExists(
        matcher: SemanticsMatcher,
        timeoutMillis: Long = 1_000L,
    ) = waitUntil(timeoutMillis) {
        onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()
    }

    fun ComposeTestRule.waitUntilExactlyOneExists(
        matcher: SemanticsMatcher,
        timeoutMillis: Long = 1_000L,
    ) = waitUntilNodeCount(matcher, 1, timeoutMillis)

    fun ComposeTestRule.waitUntilDoesNotExist(matcher: SemanticsMatcher, timeoutMillis: Long = 1_000L) =
        waitUntilNodeCount(matcher, 0, timeoutMillis)
}
