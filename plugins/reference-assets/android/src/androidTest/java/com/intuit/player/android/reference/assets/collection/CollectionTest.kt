package com.intuit.player.android.reference.assets.collection

import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.get
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.test.AssetTest
import com.intuit.playerui.android.reference.assets.test.shouldBePlayerState
import com.intuit.playerui.android.reference.assets.test.shouldBeView
import com.intuit.playerui.core.player.state.InProgressState
import org.junit.Assert.assertEquals
import org.junit.Test

class CollectionTest : AssetTest("reference-assets") {

    @Test
    fun basic() {
        launchMock("collection-basic")

        val collectionLabel = currentView?.findViewById<FrameLayout>(R.id.collection_label) ?: throw AssertionError("current view is null")
        val collectionValues = currentView?.findViewById<LinearLayout>(R.id.collection_values) ?: throw AssertionError("current view is null")

        collectionLabel[0].shouldBeView<TextView> {
            assertEquals("Collections are used to group assets.", text.toString())
        }

        collectionValues[0].shouldBeView<TextView> {
            assertEquals("This is the first item in the collection", text.toString())
        }

        collectionValues[1].shouldBeView<TextView> {
            assertEquals("This is the second item in the collection", text.toString())
        }
        currentState.shouldBePlayerState<InProgressState>()
    }
}
