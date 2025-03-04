package com.intuit.playerui.android.reference.assets.chatmessageasset

import com.intuit.playerui.android.reference.assets.collection.Collection
import com.intuit.playerui.android.reference.assets.text.Text
import com.intuit.playerui.android.testutils.asset.AssetTest
import com.intuit.playerui.android.testutils.asset.shouldBeAsset
import com.intuit.playerui.android.testutils.asset.shouldBePlayerState
import com.intuit.playerui.core.player.state.InProgressState
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

public class ChatMessageAssetTest : AssetTest("chat-message") {
    @Test
    public fun basic() {
        launchMock("chat-message-basic")

        runTest {
            currentAssetTree.shouldBeAsset<Collection> {
                val data = getData()

                val values = data.values
                assertEquals(1, values.size)
                values[0].shouldBeAsset<Text> {
                    assertEquals("Hello World!", getData().value)
                }
            }

            currentState.shouldBePlayerState<InProgressState>()
        }
    }
}
