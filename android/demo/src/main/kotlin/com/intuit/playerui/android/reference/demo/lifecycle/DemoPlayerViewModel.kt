package com.intuit.playerui.android.reference.demo.lifecycle

import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayer.Config
import com.intuit.playerui.android.a2ui.A2UIPlugin
import com.intuit.playerui.android.asset.RenderableAsset.AsyncHydrationTrackerPlugin
import com.intuit.playerui.android.asset.asyncHydrationTrackerPlugin
import com.intuit.playerui.android.lifecycle.PlayerViewModel
import com.intuit.playerui.android.reference.assets.ReferenceAssetsPlugin
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.managed.FlowManager
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.plugins.transactions.PendingTransactionPlugin
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class DemoPlayerViewModel(
    manager: FlowManager,
    format: String? = null,
) : PlayerViewModel(manager) {
    override val plugins = listOf(
        ReferenceAssetsPlugin(),
        // A2UI assets coexist with the reference assets (PascalCase vs lowercase type
        // namespaces). A2UI mocks are started with the "a2ui" content format below.
        A2UIPlugin(),
        PendingTransactionPlugin(),
        AsyncHydrationTrackerPlugin(),
    )

    // When set (e.g. "a2ui"), flows are started in that content format so the
    // registered content plugin adapts them; null keeps the default Player Flow format.
    override val contentFormat: String? = format

    public val isDebug = false

    override val config: Config = Config(
        debuggable = isDebug,
    )

    private val _playerFlowState = MutableStateFlow<PlayerFlowState?>(null)

    public val playerFlowState: StateFlow<PlayerFlowState?> = _playerFlowState.asStateFlow()

    @OptIn(ExperimentalPlayerApi::class)
    override fun apply(androidPlayer: AndroidPlayer) {
        super.apply(androidPlayer)

        androidPlayer.hooks.state.tap { state ->
            _playerFlowState.tryEmit(state)
        }

        androidPlayer.asyncHydrationTrackerPlugin!!.hooks.onHydrationComplete.tap(this::class.java.name) {
            androidPlayer.logger.info("Done hydrating!!!!")
        }
    }
}
