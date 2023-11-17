package com.intuit.player.android.reference.demo.test.assets.collection

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.player.android.reference.demo.test.base.AssetUITest
import com.intuit.player.android.reference.demo.test.base.shouldBePlayerState
import com.intuit.player.android.reference.demo.test.base.waitForViewInRoot
import com.intuit.player.jvm.core.player.state.InProgressState
import org.junit.Test

class CollectionUITest : AssetUITest("collection") {

    @Test
    fun basic() {
        launchMock()

        waitForViewInRoot(withText("Item 1"))
            .check(matches(isDisplayed()))

        onView(withText("Item 2"))
            .check(matches(isDisplayed()))

        currentState.shouldBePlayerState<InProgressState>()
    }
}
