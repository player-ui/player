package com.intuit.playerui.android.reference.assets.info

import android.widget.Button
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

class InfoTest : AssetTest("reference-assets") {

    enum class PlayerAction {
        Continue, Dismiss, Next
    }

    private fun verifyAndProceed(view: Int, action: PlayerAction? = null) {
        val infoTitle = currentView?.findViewById<FrameLayout>(R.id.info_title) ?: throw AssertionError("current view is null")
        val infoActions = currentView?.findViewById<LinearLayout>(R.id.info_actions) ?: throw AssertionError("current view is null")
        val infoFooter =
            currentView?.findViewById<FrameLayout>(R.id.info_footer) ?: throw AssertionError("current view is null")

        infoTitle[0].shouldBeView<TextView> {
            assertEquals("View $view", text.toString())
        }

        action?.let {
            val buttonOrdinal = if (action.ordinal != 1) 0 else action.ordinal
            infoActions[buttonOrdinal].shouldBeView<Button> {
                assertEquals(action.name, text.toString())
                performClick()
                blockUntilRendered()
            }
        }

        infoFooter[0].shouldBeView<TextView> {
            assertEquals("Footer Text", text.toString())
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
