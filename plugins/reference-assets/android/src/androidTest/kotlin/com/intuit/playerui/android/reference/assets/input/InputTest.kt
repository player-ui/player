package com.intuit.playerui.android.reference.assets.input

import android.widget.FrameLayout
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.view.get
import androidx.test.platform.app.InstrumentationRegistry
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.testutils.asset.AssetTest
import com.intuit.playerui.android.testutils.asset.shouldBeAtState
import com.intuit.playerui.android.testutils.asset.shouldBeView
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.dataModel
import org.junit.Assert.assertEquals
import org.junit.Test

class InputTest : AssetTest("input") {
    private fun runOnMain(block: () -> Unit) = InstrumentationRegistry.getInstrumentation().runOnMainSync(block)

    @Test
    fun basic() {
        launchMock("input-basic")

        val inputLabelContainer = currentView?.findViewById<FrameLayout>(R.id.input_label_container)
            ?: throw AssertionError("current view is null")
        val inputField = currentView?.findViewById<FormattedEditText>(R.id.input_field) ?: throw AssertionError("current view is null")

        // Drain the main looper so the label TextView is attached before we index into it.
        runOnMain { }

        inputLabelContainer[0].shouldBeView<TextView> {
            assertEquals("This is an input", text.toString())
        }

        runOnMain {
            inputField.requestFocus()
            inputField.setText("text")
        }

        player.shouldBeAtState<InProgressState> {
            assertEquals(null, dataModel.get("foo.bar"))
        }

        runOnMain { inputField.clearFocus() }

        player.shouldBeAtState<InProgressState> {
            assertEquals("text", dataModel.get("foo.bar"))
        }
    }

    @Test
    fun transition() {
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

        runOnMain {
            inputField.requestFocus()
            inputField.setText("30")
            inputField.clearFocus()
        }

        player.shouldBeAtState<InProgressState> {
            assertEquals(30, dataModel.get("foo.bar"))
        }
    }
}
