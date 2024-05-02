package com.intuit.playerui.android.reference.assets.text

import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.get
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.test.AssetTest
import com.intuit.playerui.android.reference.assets.test.shouldBeView
import org.junit.Assert
import org.junit.Test

class TextComposeTest : AssetTest("reference-assets") {

    @Test
    fun basic() {
        launchMock("text-compose-basic")

        val collectionValues = currentView?.findViewById<LinearLayout>(R.id.collection_values) ?: throw AssertionError("current view is null")
        collectionValues[0].shouldBeView<TextView> {
            Assert.assertEquals("This is some text...using Jetpack Compose", text.toString())
        }
    }
}
