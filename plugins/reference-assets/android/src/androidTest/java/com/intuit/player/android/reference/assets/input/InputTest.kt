package com.intuit.player.android.reference.assets.input

import android.widget.LinearLayout
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.view.get
import com.intuit.player.android.reference.assets.R
import com.intuit.player.android.reference.assets.test.AssetTest
import com.intuit.player.android.reference.assets.test.shouldBePlayerState
import com.intuit.player.android.reference.assets.test.shouldBeView
import com.intuit.player.jvm.core.player.state.InProgressState
import com.intuit.player.jvm.core.player.state.dataModel
import org.junit.Assert.assertEquals
import org.junit.Test

class InputTest : AssetTest("input") {

    private fun FormattedEditText.type(text: String) {
        requestFocus()
        setText(text)
        clearFocus()
    }

    @Test
    fun basic() {
        launchMock()

        val inputField = currentView?.findViewById<FormattedEditText>(R.id.input_field) ?: throw AssertionError("current view is null")

        inputField.apply {
            requestFocus()
            setText("text")
        }

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals(null, dataModel.get("foo.bar"))
        }

        inputField.clearFocus()

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals("text", dataModel.get("foo.bar"))
        }
    }

    @Test
    fun validation() {
        launchMock()

        val view = currentView.shouldBeView<ConstraintLayout>()
        val inputNoteContainer = view.findViewById<LinearLayout>(R.id.input_note_container)
        val inputField = view.findViewById<FormattedEditText>(R.id.input_field)

        inputNoteContainer.shouldBeView<LinearLayout> {}

        inputField.type("t")

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals(null, dataModel.get("foo.bar"))
        }

        inputField.type("30")

        currentState.shouldBePlayerState<InProgressState> {
            assertEquals(30, dataModel.get("foo.bar"))
        }
    }
}
