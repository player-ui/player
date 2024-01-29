package com.intuit.player.android.reference.demo.test

import android.content.Intent
import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.rules.activityScenarioRule
import com.intuit.player.android.reference.demo.test.base.waitForViewInRoot
import com.intuit.player.android.reference.demo.ui.splash.SplashActivity
import com.intuit.player.jvm.utils.makeFlow
import org.junit.Rule
import org.junit.Test

/**
 * These tests will be run on emulator and device farm
 * If there are new tests added that should be run on device farm,
 * update testFilter inclusion list in buildConfig.yml
 */
class SplashActivityTest {

    private val json by lazy {
        makeFlow(
            """
            {
                "id": "deep-link-test",
                "type": "text",
                "value": "Deep link test!"
            }
            """.trimIndent(),
        )
    }

    private val intent by lazy {
        Intent(ApplicationProvider.getApplicationContext(), SplashActivity::class.java).apply {
            action = "ACTION_VIEW"
            data = Uri.parse("player://domain.com/demo?json=$json")
        }
    }

    @get:Rule
    val activityRule = activityScenarioRule<SplashActivity>(intent)

    @Test
    fun deepLinkTest() {
        waitForViewInRoot(withText("Deep link test!")).check(matches(isDisplayed()))
    }
}
