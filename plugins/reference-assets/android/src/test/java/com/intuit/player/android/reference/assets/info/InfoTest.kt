package com.intuit.player.android.reference.assets.info

import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.get
import com.intuit.player.android.reference.assets.R
import com.intuit.player.android.reference.assets.test.AssetTest
import com.intuit.player.android.reference.assets.test.shouldBePlayerState
import com.intuit.player.android.reference.assets.test.shouldBeView
import com.intuit.player.jvm.core.player.state.InProgressState
import org.junit.Assert.assertEquals
import org.junit.Test

class InfoTest : AssetTest("info") {

    enum class PlayerAction {
        Next, Dismiss
    }

    private fun verifyAndProceed(view: Int, action: PlayerAction? = null) {
        val infoTitle = currentView?.findViewById<FrameLayout>(R.id.info_title) ?: throw AssertionError("current view is null")
        val infoActions = currentView?.findViewById<LinearLayout>(R.id.info_actions) ?: throw AssertionError("current view is null")

        infoTitle[0].shouldBeView<TextView> {
            assertEquals("View $view", text.toString())
        }

        action?.let {
            infoActions[action.ordinal].shouldBeView<Button> {
                assertEquals(action.name, text.toString())
                performClick()
            }
        }
    }

    @Test
    fun infoBasic() {
        launchMock("modal-flow")

        verifyAndProceed(1, PlayerAction.Next)
        verifyAndProceed(2, PlayerAction.Dismiss)
        verifyAndProceed(1, PlayerAction.Next)
        verifyAndProceed(2, PlayerAction.Next)
        verifyAndProceed(3, PlayerAction.Next)
        verifyAndProceed(1)

        currentState.shouldBePlayerState<InProgressState>({})
    }
}
