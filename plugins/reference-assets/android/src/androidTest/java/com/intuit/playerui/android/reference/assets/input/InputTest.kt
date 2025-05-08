package com.intuit.playerui.android.reference.assets.input

import android.widget.FrameLayout
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.view.get
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.testutils.asset.AssetTest
import com.intuit.playerui.android.testutils.asset.shouldBeAtState
import com.intuit.playerui.android.testutils.asset.shouldBeView
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.dataModel
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class InputTest : AssetTest("input") {

    private fun FormattedEditText.type(text: String) {
        requestFocus()
        setText(text)
        clearFocus()
        blockUntilRendered()
    }

    @Test
    fun basic() = runTest(UnconfinedTestDispatcher()) {
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

        player.shouldBeAtState<InProgressState> {
            assertEquals(null, dataModel.get("foo.bar"))
        }

        inputField.clearFocus()

        player.shouldBeAtState<InProgressState> {
            assertEquals("text", dataModel.get("foo.bar"))
        }
    }

    @Test
    fun transition() = runTest(UnconfinedTestDispatcher()) {
        launchMock("input-transition")

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

        player.shouldBeAtState<InProgressState> {
            assertEquals(null, dataModel.get("foo.bar"))
        }

        inputField.type("30")

        player.shouldBeAtState<InProgressState> {
            assertEquals(30, dataModel.get("foo.bar"))
        }
    }
}
