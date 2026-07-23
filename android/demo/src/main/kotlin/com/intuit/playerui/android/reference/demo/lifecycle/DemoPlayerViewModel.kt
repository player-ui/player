package com.intuit.playerui.android.reference.demo.lifecycle

import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayer.Config
import com.intuit.playerui.android.asset.SuspendableAsset.AsyncHydrationTrackerPlugin
import com.intuit.playerui.android.asset.asyncHydrationTrackerPlugin
import com.intuit.playerui.android.lifecycle.PlayerViewModel
import com.intuit.playerui.android.reference.assets.ReferenceAssetsPlugin
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.managed.AsyncFlowIterator
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.plugins.asyncnode.AsyncNodePlugin
import com.intuit.playerui.plugins.transactions.PendingTransactionPlugin
import com.intuit.playerui.plugins.types.CommonTypesPlugin
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext

class DemoPlayerViewModel(
    iterator: AsyncFlowIterator,
) : PlayerViewModel(iterator) {
    override val plugins = listOf(
        CommonTypesPlugin(),
        ReferenceAssetsPlugin(),
        PendingTransactionPlugin(),
        AsyncHydrationTrackerPlugin(),
        // Streaming action-row repro (see StreamingActionRowComposeUITest): when a
        // flow contains a live async node (the `streaming-action-rows` mock), auto-
        // stream a bounded sequence of [wrapper, action-row, renewedAsync] chunks so
        // the UI test can assert every streamed action-row actually renders. Only
        // fires for async nodes; other demo flows are unaffected.
        AsyncNodePlugin(asyncHandler = streamingActionRowHandler()),
    )

    private fun wrapperAsset(i: Int) = mapOf(
        "asset" to mapOf("id" to "wrapper-$i", "type" to "text", "value" to "Agent response $i"),
    )

    private fun actionRowAsset(i: Int) = mapOf(
        "asset" to mapOf(
            "id" to "action-row-$i",
            "type" to "action",
            "value" to "next",
            "label" to mapOf(
                "asset" to mapOf("id" to "action-row-label-$i", "type" to "text", "value" to "Action $i"),
            ),
        ),
    )

    /**
     * Streams MAX_STREAMED_ACTION_ROWS messages into the single live async node via
     * the update *callback*, each posted to Dispatchers.Main. This mirrors how a real
     * streaming host must marshal its stream-complete callback onto the main thread —
     * resolving on a background dispatcher would touch Android views off-main
     * (CalledFromWrongThreadException). Each update replaces the node with the full
     * accumulated [wrapper, action-row, ...] list; the handler then suspends so the
     * node stays live (no null return that would revert the view).
     */
    private fun streamingActionRowHandler(): suspend (com.intuit.playerui.core.bridge.Node, ((Any?) -> Unit)?) -> Any? =
        handler@{ _, callback ->
            withContext(Dispatchers.Main) {
                val accumulated = mutableListOf<Map<String, Any?>>()
                for (i in 0 until MAX_STREAMED_ACTION_ROWS) {
                    accumulated += wrapperAsset(i)
                    accumulated += actionRowAsset(i)
                    callback?.invoke(accumulated.toList())
                }
            }
            // Keep the async node pending so the accumulated view is not reverted.
            awaitCancellation()
        }

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

    private companion object {
        /** Streamed messages emitted by the streaming-action-rows repro flow. */
        const val MAX_STREAMED_ACTION_ROWS = 5
    }
}
