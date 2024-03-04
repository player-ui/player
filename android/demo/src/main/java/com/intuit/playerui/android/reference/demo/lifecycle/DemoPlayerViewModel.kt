package com.intuit.playerui.android.reference.demo.lifecycle

import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayer.Config
import com.intuit.playerui.android.mvvm.lifecycle.PlayerViewModel
import com.intuit.playerui.android.reference.assets.ReferenceAssetsPlugin
import com.intuit.playerui.core.managed.AsyncFlowIterator
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.plugins.transactions.PendingTransactionPlugin
import com.intuit.playerui.plugins.types.CommonTypesPlugin
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class DemoPlayerViewModel(iterator: AsyncFlowIterator) : PlayerViewModel(iterator) {

    override val plugins = listOf(
        CommonTypesPlugin(),
        ReferenceAssetsPlugin(),
        PendingTransactionPlugin(),
    )

    override val config: Config = Config(
        debuggable = true,
    )

    private val _playerFlowState = MutableStateFlow<PlayerFlowState?>(null)

    public val playerFlowState: StateFlow<PlayerFlowState?> = _playerFlowState.asStateFlow()

    override fun apply(androidPlayer: AndroidPlayer) {
        super.apply(androidPlayer)

        androidPlayer.hooks.state.tap { state ->
            _playerFlowState.tryEmit(state)
        }
    }
}
