package com.intuit.playerui.android.reference.assets.text

import android.widget.TextView
import androidx.core.view.get
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.testutils.asset.AssetTest
import com.intuit.playerui.android.testutils.asset.shouldBeView
import com.intuit.playerui.android.reference.assets.collection.Collection
import com.intuit.playerui.android.reference.assets.test.shouldBeAsset
import com.intuit.playerui.android.reference.assets.test.shouldBeView
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class TextTest : AssetTest("text") {

    @Test
    fun basic() {
        launchMock("text-basic")

        runTest {
            currentAssetTree.shouldBeAsset<Collection> {
                val data = getData()

                val values = data.values
                assertEquals(2, values.size)
                values[0].shouldBeAsset<Text> {
                    assertEquals("This is some text", getData().value)
                }

                values[1].shouldBeAsset<Text> {
                    assertEquals("This is some text that is a link", getData().value)
                }
            }
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
