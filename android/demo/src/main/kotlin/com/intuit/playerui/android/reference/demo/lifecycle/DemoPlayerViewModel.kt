package com.intuit.playerui.android.reference.demo.lifecycle

import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayer.Config
import com.intuit.playerui.android.a2ui.A2UIAndroidPlugin
import com.intuit.playerui.android.asset.SuspendableAsset.AsyncHydrationTrackerPlugin
import com.intuit.playerui.android.asset.asyncHydrationTrackerPlugin
import com.intuit.playerui.android.lifecycle.PlayerViewModel
import com.intuit.playerui.android.reference.assets.ReferenceAssetsPlugin
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.managed.AsyncFlowIterator
import com.intuit.playerui.core.player.StartOptions
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.plugins.transactions.PendingTransactionPlugin
import com.intuit.playerui.plugins.types.CommonTypesPlugin
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class DemoPlayerViewModel(
    iterator: AsyncFlowIterator,
    private val format: String? = null,
) : PlayerViewModel(iterator) {
    override val plugins = listOf(
        CommonTypesPlugin(),
        ReferenceAssetsPlugin(),
        A2UIAndroidPlugin(),
        PendingTransactionPlugin(),
        AsyncHydrationTrackerPlugin(),
    )

    /** Non-Player content (e.g. A2UI snapshots) is started with its declared format. */
    override val startOptions: StartOptions? = format?.let { StartOptions(format = it) }

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
