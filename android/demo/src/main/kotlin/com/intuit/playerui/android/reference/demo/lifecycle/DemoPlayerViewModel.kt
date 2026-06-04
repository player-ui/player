package com.intuit.playerui.android.reference.demo.lifecycle

import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayer.Config
import com.intuit.playerui.android.asset.RenderableAsset.AsyncHydrationTrackerPlugin
import com.intuit.playerui.android.asset.asyncHydrationTrackerPlugin
import com.intuit.playerui.android.lifecycle.PlayerViewModel
import com.intuit.playerui.android.reference.assets.ReferenceAssetsPlugin
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.managed.FlowManager
import com.intuit.playerui.core.player.DataServiceFactory
import com.intuit.playerui.core.player.ServicesConfig
import com.intuit.playerui.core.player.services.KotlinDataController
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.plugins.transactions.PendingTransactionPlugin
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class DemoPlayerViewModel(
    manager: FlowManager,
) : PlayerViewModel(manager) {
    override val plugins = listOf(
        ReferenceAssetsPlugin(),
        PendingTransactionPlugin(),
        AsyncHydrationTrackerPlugin(),
    )

    public val isDebug = false

    override val config: Config = Config(
        debuggable = isDebug,
    )

    /**
     * Demonstrates a Kotlin-native data controller replacing the JS default.
     * When the `action-counter` flow's expression `{{count}} = {{count}} + 1`
     * fires, JS calls `dataController.set({"count": N})` — which lands in our
     * Kotlin lambda and rewrites the value to `N * 10 + 7`. Initial 0 becomes
     * 7 on first tap (JS computed 1 → we wrote 17? actually: JS reads 0, adds
     * 1, sets 1 → we write 17). Next tap: JS reads 17, adds 1, sets 18 → we
     * write 187. Each tap the displayed number explodes, proving the Kotlin
     * `set` is on the hot path between JS expression eval and the data store.
     */
    @OptIn(ExperimentalPlayerApi::class)
    override val services: ServicesConfig = ServicesConfig(
        data = DataServiceFactory { ctx ->
            val initial: Map<String, Any?> = ctx.getObject("data") ?: emptyMap()
            val pathResolverNode = ctx.getObject("pathResolver")
            val parseInvokable = pathResolverNode
                ?.getInvokable<Any?>("parse")
            KotlinDataController(
                initialData = initial,
                setTransformer = { binding, value ->
                    if (binding == "count" && value is Number) {
                        value.toInt() * 10 + 7
                    } else {
                        value
                    }
                },
                parseBinding = parseInvokable?.let { invoke ->
                    { binding: String -> invoke.invoke(binding) }
                },
            ).jsView
        },
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
