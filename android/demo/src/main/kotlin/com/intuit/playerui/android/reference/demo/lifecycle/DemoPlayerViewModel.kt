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
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

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

    /** Number of messages the streaming repro handler will emit before ending the stream. */
    private var streamedActionRowCount = 0

    private fun streamingActionRowHandler(): suspend (com.intuit.playerui.core.bridge.Node, ((Any?) -> Unit)?) -> Any? =
        handler@{ _, _ ->
            val i = streamedActionRowCount++
            val wrapper = mapOf(
                "asset" to mapOf("id" to "wrapper-$i", "type" to "text", "value" to "Agent response $i"),
            )
            val actionRow = mapOf(
                "asset" to mapOf(
                    "id" to "action-row-$i",
                    "type" to "action",
                    "value" to "next",
                    "label" to mapOf(
                        "asset" to mapOf("id" to "action-row-label-$i", "type" to "text", "value" to "Action $i"),
                    ),
                ),
            )
            // Renew the async node to keep the stream live, until the cap is reached.
            if (i < MAX_STREAMED_ACTION_ROWS - 1) {
                listOf(wrapper, actionRow, mapOf("id" to "msg-${i + 1}", "async" to true, "flatten" to true))
            } else {
                listOf(wrapper, actionRow)
            }
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
