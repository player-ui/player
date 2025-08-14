package com.intuit.playerui.android.reference.demo.test.assets.collection

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.playerui.android.reference.demo.test.base.ComposeUITest
import com.intuit.playerui.android.reference.demo.test.base.shouldBeAtState
import com.intuit.playerui.android.reference.demo.test.base.waitForViewInRoot
import com.intuit.playerui.core.player.state.InProgressState
import org.junit.Test

class CollectionUITest : ComposeUITest("collection") {

    @Test
    fun basic() {
        launchMock("collection-basic")

        waitForViewInRoot(withText("Collections are used to group assets."))
            .check(matches(isDisplayed()))

        onView(withText("This is the first item in the collection"))
            .check(matches(isDisplayed()))

        onView(withText("This is the second item in the collection"))
            .check(matches(isDisplayed()))

        player.shouldBeAtState<InProgressState>()
    }
}
