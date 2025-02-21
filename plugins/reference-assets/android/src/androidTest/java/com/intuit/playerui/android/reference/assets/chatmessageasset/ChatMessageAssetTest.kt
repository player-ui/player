package com.intuit.playerui.android.reference.assets.chatmessageasset

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

public class ChatMessageAssetTest : AssetTest("chat-message") {
    @Test
    public fun basic() {
        launchMock("chat-message-basic")

        val collectionValues = currentView?.findViewById<LinearLayout>(R.id.collection_values)
            ?: throw AssertionError("current view is null")

        collectionValues[0].shouldBeView<TextView> {
            assertEquals("Hello World!", text.toString())
        }

        currentState.shouldBePlayerState<InProgressState>()
    }
}