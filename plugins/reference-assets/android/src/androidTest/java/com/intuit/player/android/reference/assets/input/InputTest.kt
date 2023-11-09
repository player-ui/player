package com.intuit.player.android.reference.assets.input

import android.widget.FrameLayout
import android.widget.TextView
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

class InputTest : AssetTest("reference-assets") {

    private fun FormattedEditText.type(text: String) {
        requestFocus()
        setText(text)
        clearFocus()
    }

    @Test
    fun basic() {
        launchMock("input-basic")

        val inputLabelContainer = currentView?.findViewById<FrameLayout>(R.id.input_label_container) ?: throw AssertionError("current view is null")
        val inputField = currentView?.findViewById<FormattedEditText>(R.id.input_field) ?: throw AssertionError("current view is null")

        inputLabelContainer[0].shouldBeView<TextView> {
            assertEquals("This is an input", text.toString())
        }

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
        launchMock("input-validation")

        val view = currentView.shouldBeView<ConstraintLayout>()
        val inputLabelContainer = view.findViewById<FrameLayout>(R.id.input_label_container)
        val inputNoteContainer = view.findViewById<FrameLayout>(R.id.input_note_container)
        val inputField = view.findViewById<FormattedEditText>(R.id.input_field)

        inputLabelContainer[0].shouldBeView<TextView> {
            assertEquals("Input with validation and formatting", text.toString())
        }

        inputNoteContainer[0].shouldBeView<TextView> {
            assertEquals("It expects a positive integer", text.toString())
        }

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
