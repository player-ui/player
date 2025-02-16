package com.intuit.playerui.android.reference.assets.info

import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.view.get
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.action.Action
import com.intuit.playerui.android.reference.assets.text.Text
import com.intuit.playerui.android.testutils.asset.AssetTest
import com.intuit.playerui.android.testutils.asset.shouldBeAsset
import com.intuit.playerui.android.testutils.asset.shouldBePlayerState
import com.intuit.playerui.android.testutils.asset.shouldBeView
import com.intuit.playerui.core.player.state.InProgressState
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class InfoTest : AssetTest("info") {

    enum class PlayerAction {
        Continue, Dismiss, Next
    }

    private fun verifyAndProceed(view: Int, action: PlayerAction? = null) {
        val infoTitle = currentView?.findViewById<FrameLayout>(R.id.info_title) ?: throw AssertionError("current view is null")
        val infoFooter =
            currentView?.findViewById<FrameLayout>(R.id.info_footer) ?: throw AssertionError("current view is null")

        infoTitle[0].shouldBeView<TextView> {
            assertEquals("View $view", text.toString())
        }

        runTest {
            currentAssetTree.shouldBeAsset<Info> {
                val infoActions = data.actions

                action?.let {
                    val buttonOrdinal = if (action.ordinal != 1) 0 else action.ordinal
                    infoActions[buttonOrdinal].shouldBeAsset<Action> {
                        val data = getData()
                        data.label.shouldBeAsset<Text>()
                        data.run()
                    }
                }
            }
            infoFooter[0].shouldBeView<TextView> {
                assertEquals("Footer Text", text.toString())
            }
        }
    }

    @Test
    fun infoBasic() {
        launchMock("info-modal-flow")

        verifyAndProceed(1, PlayerAction.Continue)
        verifyAndProceed(2, PlayerAction.Dismiss)
        verifyAndProceed(1, PlayerAction.Continue)
        verifyAndProceed(2, PlayerAction.Next)
        verifyAndProceed(3, PlayerAction.Next)
        verifyAndProceed(1)

        currentState.shouldBePlayerState<InProgressState>()
    }
}
