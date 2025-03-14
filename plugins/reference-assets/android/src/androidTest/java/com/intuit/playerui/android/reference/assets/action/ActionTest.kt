package com.intuit.playerui.android.reference.assets.action

import android.widget.Button
import android.widget.LinearLayout
import androidx.core.view.get
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.text.Text
import com.intuit.playerui.android.testutils.asset.AssetTest
import com.intuit.playerui.android.testutils.asset.shouldBeAsset
import com.intuit.playerui.android.testutils.asset.shouldBePlayerState
import com.intuit.playerui.android.testutils.asset.shouldBeView
import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.dataModel
import org.junit.Assert.assertEquals
import org.junit.Test

class ActionTest : AssetTest("action") {

    @Test
    fun actionExpression() {
        launchMock("action-basic")

        currentAssetTree.shouldBeAsset<Action> {
            data.label.shouldBeAsset<Text> {
                assertEquals("Count: 0", data.value)
            }
        }

        currentView.shouldBeView<Button> {
            repeat(10) {
                assertEquals("Count: $it", text.toString())
                performClick()
                blockUntilRendered()
            }
        }

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals(10, dataModel.get("count"))
        }
    }

    @Test
    fun transitionToEndSuccess() {
        launchMock("action-transition-to-end")

        val collectionValues = currentView?.findViewById<LinearLayout>(R.id.collection_values) ?: throw AssertionError("current view is null")
        assertEquals(2, collectionValues.childCount)

        collectionValues[0].shouldBeView<Button> {
            assertEquals("End the flow (success)", text.toString())
            performClick()
            blockUntilRendered()
        }

        currentState.shouldBePlayerState<CompletedState> {
            assertEquals("done", endState.outcome)
        }
    }

    // TODO: Fix invalid expression not throwing error in core
    @Test
    fun transitionToEndError() {
        launchMock("action-transition-to-end")

        val collectionValues = currentView?.findViewById<LinearLayout>(R.id.collection_values) ?: throw AssertionError("current view is null")
        assertEquals(2, collectionValues.childCount)

        collectionValues[1].shouldBeView<Button> {
            assertEquals("End the flow (error)", text.toString())
            performClick()
            blockUntilRendered()
        }

        currentState.shouldBePlayerState<ErrorState> {
            assertEquals("Error: Unclosed brace after \"foo.bar..}\" at character 12", error.message)
        }
    }
}
