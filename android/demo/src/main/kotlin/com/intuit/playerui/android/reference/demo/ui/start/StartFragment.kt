package com.intuit.playerui.android.reference.demo.ui.start

import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.lifecycleScope
import com.intuit.playerui.android.lifecycle.ManagedPlayerState
import com.intuit.playerui.android.reference.demo.ui.base.BasePlayerFragment
import com.intuit.playerui.android.reference.demo.ui.main.MainViewModel
import com.intuit.playerui.utils.mocks.getFlow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class StartFragment : BasePlayerFragment() {
    private val mainViewModel: MainViewModel by activityViewModels()

    override val flow: String by lazy {
        mainViewModel.defaultMock.getFlow(requireActivity().assets)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ) = super.onCreateView(inflater, container, savedInstanceState).apply {
        when (val state = playerViewModel.state.value) {
            is ManagedPlayerState.Running -> lifecycleScope.launch(Dispatchers.Default) {
                handleAssetUpdate(state.asset, state.animateViewTransition)
            }

            is ManagedPlayerState.Done,
            is ManagedPlayerState.Error,
            -> reset()

            ManagedPlayerState.NotStarted,
            ManagedPlayerState.Pending,
            -> Unit
        }
    }

    override fun onDone(doneState: ManagedPlayerState.Done) {
        when (doneState.completedState?.endState?.outcome) {
            "dismiss" -> binding.playerCanvas.removeAllViews()
            "randomize" -> mainViewModel.randomize()
            else -> Unit
        }
    }
}
