package com.intuit.player.android.reference.assets.collection

import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.get
import com.intuit.player.android.reference.assets.test.AssetTest
import com.intuit.player.android.reference.assets.test.shouldBePlayerState
import com.intuit.player.android.reference.assets.test.shouldBeView
import com.intuit.player.jvm.core.player.state.InProgressState
import org.junit.Assert.assertEquals
import org.junit.Test

class CollectionTest : AssetTest("collection") {

    @Test
    fun basic() {
        launchMock()

        currentView.shouldBeView<LinearLayout> {
            assertEquals(2, childCount)
            get(0).shouldBeView<TextView> {
                assertEquals("This is the first item in the collection", text.toString())
            }
            get(1).shouldBeView<TextView> {
                assertEquals("This is the second item in the collection", text.toString())
            }
        }

        currentState.shouldBePlayerState<InProgressState>()
    }
}
