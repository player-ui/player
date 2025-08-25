package com.intuit.playerui.android.reference.assets.collection

import androidx.core.view.get
import com.intuit.playerui.android.reference.assets.text.Text
import com.intuit.playerui.android.testutils.asset.AssetTest
import com.intuit.playerui.android.testutils.asset.shouldBeAsset
import com.intuit.playerui.android.testutils.asset.shouldBeAtState
import com.intuit.playerui.core.player.state.InProgressState
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class CollectionTest : AssetTest("collection") {
    @Test
    fun basic() {
        launchMock("collection-basic")

        runTest {
            currentAssetTree.shouldBeAsset<Collection> {
                val data = getData()
                data.label.shouldBeAsset<Text> {
                    assertEquals("Collections are used to group assets.", getData().value)
                }

                val values = data.values
                assertEquals(2, values.size)
                values[0].shouldBeAsset<Text> {
                    assertEquals("This is the first item in the collection", getData().value)
                }

                values[1].shouldBeAsset<Text> {
                    assertEquals("This is the second item in the collection", getData().value)
                }
            }
        }
        player.shouldBeAtState<InProgressState>()
    }
}
