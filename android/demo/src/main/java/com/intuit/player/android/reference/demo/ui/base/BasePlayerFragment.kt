package com.intuit.player.android.reference.demo.ui.base

import android.graphics.drawable.GradientDrawable
import android.view.View
import androidx.core.view.get
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.afollestad.materialdialogs.MaterialDialog
import com.intuit.player.android.lifecycle.ManagedPlayerState
import com.intuit.player.android.lifecycle.PlayerViewModel
import com.intuit.player.android.reference.demo.lifecycle.DemoPlayerViewModel
import com.intuit.player.android.ui.PlayerFragment
import com.intuit.player.jvm.core.managed.AsyncFlowIterator
import kotlinx.coroutines.*

/** Simple [PlayerFragment] example that builds a [DemoPlayerViewModel] w/ a single flow iterator */
abstract class BasePlayerFragment : PlayerFragment() {

    abstract val flow: String

    override val playerViewModel by viewModels<DemoPlayerViewModel> {
        PlayerViewModel.Factory(AsyncFlowIterator(flow), ::DemoPlayerViewModel)
    }

    private val currentPlayerCanvas get() = binding.playerCanvas.getChildAt(0)

    private suspend fun toggleScreenShare(active: Boolean) = withContext(Dispatchers.Main) {
        binding.playerCanvas.background = if (active) GradientDrawable().apply {
            setStroke(30, resources.getColor(android.R.color.holo_green_light))
        } else null
    }

    override fun buildFallbackView(exception: Exception): View? = currentPlayerCanvas

    override fun buildDoneView(): View? = currentPlayerCanvas

    override fun onDone(doneState: ManagedPlayerState.Done) {
        showDialog {
            title(text = "Flows completed successfully!")
            message(text = doneState.completedState?.endState.toString())
        }
    }

    override fun onError(errorState: ManagedPlayerState.Error) {
        showDialog {
            title(text = "Error in Flow!")
            message(text = errorState.exception.message)
        }
    }

    protected fun showDialog(builder: MaterialDialog.() -> Unit) {
        MaterialDialog(requireContext()).show {
            positiveButton(text = "Reset") { reset() }
            negativeButton(text = "Back") {
                findNavController().popBackStack()
            }
            cancelable(false)
            builder()
        }
    }
}
