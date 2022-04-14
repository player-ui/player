package com.intuit.player.android.reference.demo.ui.start

import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.fragment.app.activityViewModels
import com.intuit.player.android.lifecycle.ManagedPlayerState
import com.intuit.player.android.reference.demo.ui.base.BasePlayerFragment
import com.intuit.player.android.reference.demo.ui.main.MainViewModel
import com.intuit.player.jvm.utils.mocks.getFlow

class StartFragment : BasePlayerFragment() {
    private val mainViewModel: MainViewModel by activityViewModels()

    override val flow: String by lazy {
        mainViewModel.defaultMock.getFlow(requireActivity().assets)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ) = super.onCreateView(inflater, container, savedInstanceState).apply {
        reset()
    }

    override fun onDone(doneState: ManagedPlayerState.Done) {
        when (doneState.completedState?.endState?.outcome) {
            "dismiss" -> binding.playerCanvas.removeAllViews()
            "randomize" -> mainViewModel.randomize()
        }
    }
}
