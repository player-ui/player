package com.intuit.player.android.reference.demo.test.base

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import androidx.test.espresso.matcher.ViewMatchers
import com.applitools.eyes.android.common.BatchInfo
import com.applitools.eyes.android.common.Feature
import com.applitools.eyes.android.common.config.Configuration
import com.applitools.eyes.android.components.androidx.AndroidXComponentsProvider
import com.applitools.eyes.android.espresso.Eyes
import com.applitools.eyes.android.espresso.fluent.Target
import com.intuit.player.android.reference.demo.ApplitoolsConfig.API_KEY
import com.intuit.player.android.reference.demo.ApplitoolsConfig.BATCH_ID
import com.intuit.player.android.reference.demo.R

abstract class ApplitoolsTest {

    val context: Application by lazy {
        ApplicationProvider.getApplicationContext()
    }

    // Initialize the eyes SDK and set your private API key.
    val eyes by lazy {
        Eyes().apply {
            componentsProvider = AndroidXComponentsProvider()
            configuration = Configuration().apply {
                appName = "Android Reference Assets"
                addProperty("platform", "android")
                batch = batchInfo
                apiKey = API_KEY
                setFeatures(Feature.PIXEL_COPY_SCREENSHOT)
                setServerUrl("https://intuiteyesapi.applitools.com")
            }
        }
    }

    fun Eyes.open(appName: String, testName: String, block: Eyes.() -> Unit) {
        try {
            open(appName, testName)
            block()
            close()
        } finally {
            abortIfNotClosed()
        }
    }

    fun Eyes.checkPlayer(name: String) = check(name, Target.region(ViewMatchers.withId(R.id.player_canvas)))

    companion object {
        val batchInfo = BatchInfo("android-reference-assets@${BATCH_ID}").apply {
            id = BATCH_ID
        }
    }
}
