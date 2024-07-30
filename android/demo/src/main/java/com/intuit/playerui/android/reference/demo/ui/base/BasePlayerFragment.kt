package com.intuit.playerui.android.reference.demo.ui.base

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.afollestad.materialdialogs.MaterialDialog
import com.intuit.playerui.android.lifecycle.ManagedPlayerState
import com.intuit.playerui.android.lifecycle.PlayerViewModel
import com.intuit.playerui.android.reference.demo.lifecycle.DemoPlayerViewModel
import com.intuit.playerui.android.ui.PlayerFragment
import com.intuit.playerui.core.bridge.serialization.json.prettify
import com.intuit.playerui.core.bridge.toJson
import com.intuit.playerui.core.managed.AsyncFlowIterator
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/** Simple [PlayerFragment] example that builds a [DemoPlayerViewModel] w/ a single flow iterator */
abstract class BasePlayerFragment : PlayerFragment() {

    abstract val flow: String

    override val playerViewModel by viewModels<DemoPlayerViewModel> {
        PlayerViewModel.Factory(AsyncFlowIterator(flow), ::DemoPlayerViewModel)
    }

    private val currentPlayerCanvas get() = binding.playerCanvas.getChildAt(0)

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        if (playerViewModel.isDebug) com.alexii.j2v8debugger.StethoHelper.initializeDebugger(requireContext(), playerViewModel.player)
        return super.onCreateView(inflater, container, savedInstanceState)
    }

    override fun buildFallbackView(exception: Exception): View? = currentPlayerCanvas

    override fun buildDoneView(): View? = currentPlayerCanvas

    override fun onDone(doneState: ManagedPlayerState.Done) {
        val message = doneState.completedState?.endState?.node?.toJson()?.prettify()
        showDialog {
            title(text = "Flows completed successfully!")
            message(text = message)
        }
    }

    override fun onError(errorState: ManagedPlayerState.Error) {
        val message = errorState.exception.message
        showDialog {
            title(text = "Error in Flow!")
            message(text = message)
        }
    }

    protected fun showDialog(builder: MaterialDialog.() -> Unit) {
        lifecycleScope.launch(Dispatchers.Main) {
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
}
