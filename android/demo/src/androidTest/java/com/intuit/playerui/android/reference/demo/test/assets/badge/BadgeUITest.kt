package com.intuit.playerui.android.reference.demo.test.assets.badge

import androidx.compose.ui.test.onNodeWithText
import com.intuit.playerui.android.reference.demo.test.base.ComposeUITest
import com.intuit.playerui.android.reference.demo.test.base.shouldBeAtState
import com.intuit.playerui.core.player.state.InProgressState
import org.junit.Test

class BadgeUITest : ComposeUITest("badge") {

    @Test
    fun basic() {
        launchMock("badge-all")

        androidComposeRule.onNodeWithText("INFO")
            .assertExists()
        androidComposeRule.onNodeWithText("ERROR")
            .assertExists()
        player.shouldBeAtState<InProgressState>()
    }
}
