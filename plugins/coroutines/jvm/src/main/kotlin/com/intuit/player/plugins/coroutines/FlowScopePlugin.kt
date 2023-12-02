package com.intuit.player.plugins.coroutines

import com.intuit.playerui.core.flow.Flow
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.subScope
import com.intuit.playerui.core.plugins.PlayerPlugin
import com.intuit.playerui.core.plugins.findPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.job
import kotlin.coroutines.CoroutineContext
import kotlin.coroutines.EmptyCoroutineContext

/** Simple [PlayerPlugin] that provides a [CoroutineScope] reflective of the current [Flow] */
public class FlowScopePlugin : PlayerPlugin {

    /** [CoroutineScope] reflective of the [Player]s current [Flow] */
    public var flowScope: CoroutineScope? = null; private set

    override fun apply(player: Player) {
        player.hooks.state.tap { state ->
            // Any state change should cancel the current state
            flowScope?.cancel("player changed state: $state")
            if (state is InProgressState) {
                // only create a new scope for new flows, determined on InProgressState updates
                flowScope = player.subScope(FlowContext(state.flow))
            }
        }
    }

    /** Build a child scope of the current [flowScope] to ensure that these scopes will be structured according to the current [Flow] */
    public fun subScope(coroutineContext: CoroutineContext = EmptyCoroutineContext): CoroutineScope? = flowScope?.let {
        CoroutineScope(it.coroutineContext + SupervisorJob(it.coroutineContext.job) + coroutineContext)
    }

    /** [CoroutineContext.Element] that contains the [Flow] bound to the current [CoroutineContext] */
    public class FlowContext(public val flow: Flow) : CoroutineContext.Element {

        override val key: CoroutineContext.Key<FlowContext> = Key

        public companion object Key : CoroutineContext.Key<FlowContext>
    }
}

/** Convenience getter for getting the current [Flow] bound to the [CoroutineScope] */
public val CoroutineScope.flow: Flow?
    get() = coroutineContext[FlowScopePlugin.FlowContext]?.flow

// Set of [Player] extensions to make flow scope integration easier

/** Convenience getter to find the first [FlowScopePlugin] registered to the [Player] */
public val Player.flowScopePlugin: FlowScopePlugin? get() = findPlugin()

/** Convenience getter to obtain the current [FlowScopePlugin.flowScope] */
public val Player.flowScope: CoroutineScope? get() = flowScopePlugin?.flowScope

/** Convenience method for building a subscope of the [flowScope] */
public fun Player.subScope(coroutineContext: CoroutineContext = EmptyCoroutineContext): CoroutineScope? =
    flowScopePlugin?.subScope(coroutineContext)
