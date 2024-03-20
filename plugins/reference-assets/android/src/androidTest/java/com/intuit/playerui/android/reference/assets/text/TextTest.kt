package com.intuit.playerui.android.reference.assets.text

import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.get
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.test.AssetTest
import com.intuit.playerui.android.reference.assets.test.shouldBeView
import org.junit.Assert.assertEquals
import org.junit.Test

class TextTest : AssetTest("reference-assets") {

    @Test
    fun basic() {
        launchMock("text-basic")

        val collectionValues = currentView?.findViewById<LinearLayout>(R.id.collection_values) ?: throw AssertionError("current view is null")
        collectionValues[0].shouldBeView<TextView> {
            assertEquals("This is some text.", text.toString())
        }

        collectionValues[1].shouldBeView<TextView> {
            assertEquals("This is some text that is a link", text.toString())
        }
    }

    @Test
    fun link() {
        launchMock("text-with-link")

        currentView.shouldBeView<TextView> {
            assertEquals("A Link", text.toString())
            performClick()
        }
    }
}
