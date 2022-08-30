package com.intuit.player.android.reference.assets.text

import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.get
import com.intuit.player.android.reference.assets.test.AssetTest
import com.intuit.player.android.reference.assets.test.shouldBeView
import org.junit.Assert.assertEquals
import org.junit.Test

class TextTest : AssetTest("text") {

    @Test
    fun basic() {
        launchMock()

        currentView.shouldBeView<LinearLayout> {
            assertEquals(2, childCount)
            get(0).shouldBeView<TextView> {
                assertEquals("This is some text.", text.toString())
            }
            get(1).shouldBeView<TextView> {
                assertEquals("This is some text that is a link", text.toString())
            }
        }
    }

    @Test
    fun link() {
        launchMock("with-link")

        currentView.shouldBeView<TextView> {
            assertEquals("A Link", text.toString())
            performClick()
        }
    }
}
