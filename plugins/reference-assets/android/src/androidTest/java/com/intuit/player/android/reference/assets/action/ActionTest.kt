package com.intuit.player.android.reference.assets.action

import android.widget.Button
import android.widget.LinearLayout
import androidx.core.view.get
import com.intuit.player.android.reference.assets.test.AssetTest
import com.intuit.player.android.reference.assets.test.shouldBeAsset
import com.intuit.player.android.reference.assets.test.shouldBePlayerState
import com.intuit.player.android.reference.assets.test.shouldBeView
import com.intuit.player.android.reference.assets.text.Text
import com.intuit.player.jvm.core.player.state.CompletedState
import com.intuit.player.jvm.core.player.state.ErrorState
import com.intuit.player.jvm.core.player.state.InProgressState
import com.intuit.player.jvm.core.player.state.dataModel
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
            }
        }

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals(10, dataModel.get("count"))
        }
    }

    @Test
    fun transitionToEndSuccess() {
        launchMock("action-transition-to-end")

        currentView.shouldBeView<LinearLayout> {
            assertEquals(2, childCount)
            get(0).shouldBeView<Button> {
                assertEquals("End the flow (success)", text.toString())
                performClick()
            }
        }

        currentState.shouldBePlayerState<CompletedState> {
            assertEquals("done", endState.outcome)
        }
    }

    @Test
    fun transitionToEndError() {
        launchMock("action-transition-to-end")

        currentView.shouldBeView<LinearLayout> {
            assertEquals(2, childCount)
            get(1).shouldBeView<Button> {
                assertEquals("End the flow (error)", text.toString())
                performClick()
            }
        }

        currentState.shouldBePlayerState<ErrorState> {
            assertEquals("Error: Unclosed brace after \"foo.bar..}\" at character 12", error.message)
        }
    }
}
