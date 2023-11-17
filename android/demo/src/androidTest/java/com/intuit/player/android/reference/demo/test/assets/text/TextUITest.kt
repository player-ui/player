package com.intuit.player.android.reference.demo.test.assets.text

import android.app.Activity.RESULT_CANCELED
import android.app.Instrumentation.ActivityResult
import android.content.Intent.ACTION_VIEW
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.intent.Intents.intended
import androidx.test.espresso.intent.Intents.intending
import androidx.test.espresso.intent.matcher.IntentMatchers.hasAction
import androidx.test.espresso.intent.matcher.IntentMatchers.hasData
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import com.intuit.player.android.reference.demo.test.base.AssetUITest
import com.intuit.player.android.reference.demo.test.base.waitForViewInRoot
import org.hamcrest.Matchers.allOf
import org.junit.Test

class TextUITest : AssetUITest("text") {

    @Test
    fun basic() {
        launchMock()

        waitForViewInRoot(withText("Some text content"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun link() {
        launchMock("with-link")

        val openLink = allOf(
            hasAction(ACTION_VIEW),
            hasData("http://www.intuit.com")
        )

        intending(openLink).respondWith(ActivityResult(RESULT_CANCELED, null))

        waitForViewInRoot(withText("A Link"))
            .check(matches(isDisplayed()))
            .perform(click())

        intended(openLink)
    }
}
