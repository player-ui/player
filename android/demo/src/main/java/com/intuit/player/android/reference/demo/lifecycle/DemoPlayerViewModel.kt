package com.intuit.player.android.reference.demo.lifecycle

import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.lifecycle.PlayerViewModel
import com.intuit.player.android.reference.assets.ReferenceAssetsPlugin
import com.intuit.player.jvm.core.managed.AsyncFlowIterator
import com.intuit.player.jvm.core.player.state.PlayerFlowState
import com.intuit.player.plugins.transactions.PendingTransactionPlugin
import com.intuit.player.plugins.types.CommonTypesPlugin
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class DemoPlayerViewModel(iterator: AsyncFlowIterator) : PlayerViewModel(iterator) {

    override val plugins = listOf(
        CommonTypesPlugin(),
        ReferenceAssetsPlugin(),
        PendingTransactionPlugin(),
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
