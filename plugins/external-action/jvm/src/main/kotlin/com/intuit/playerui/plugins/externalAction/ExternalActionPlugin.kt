package com.intuit.playerui.plugins.externalAction

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.Promise
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.flow.state.NavigationFlowExternalState
import com.intuit.playerui.core.flow.state.NavigationFlowState
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.ControllerState
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.PlayerPlugin
import com.intuit.playerui.core.plugins.findPlugin
import com.intuit.playerui.plugins.settimeout.SetTimeoutPlugin

public data class ExternalActionHandler(
    val match: Map<String, Any>,
    val handler: Handler,
) {
    /**
     * Function definition of an external action handler
     * @param state The NavigationFlowExternalState that was transitioned to
     * @param options The ControllerState providing access to data and expression evaluation
     * @param transition Callback to transition to the next state
     */
    public fun interface Handler {
        public fun onExternalAction(
            state: NavigationFlowExternalState,
            options: ControllerState,
            transition: (String) -> Unit,
        )
    }

    init {
        require(match.containsKey("ref")) {
            "The match map must contain a 'ref' key. Got: $match"
        }
    }
}

/**
 * Core plugin wrapper providing external action support for the JVM Player.
 *
 * This plugin uses a registry-based approach to match external states to handler functions.
 * Multiple handlers can be registered, and handlers are matched using partial object matching
 * with specificity ordering (more specific matches take precedence).
 *
 * @param handlers List of handler configurations with matchers and handler functions.
 */
public class ExternalActionPlugin(
    vararg handlers: ExternalActionHandler,
) : JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH),
    PlayerPlugin {
    private lateinit var player: Player
    private val handlers: List<ExternalActionHandler> = handlers.toList()

    override fun apply(player: Player) {
        this.player = player
    }

    override fun apply(runtime: Runtime<*>) {
        SetTimeoutPlugin().apply(runtime)
        runtime.load(ScriptContext(script, BUNDLED_SOURCE_PATH))

        // Build array of [match, handler] tuples for JavaScript
        val jsHandlers = handlers.map { handlerConfig ->
            // Register handler callback
            val callback: (Node, Node) -> Any? = callback@{ state, options ->
                val externalState = state.deserialize(NavigationFlowState.serializer())
                    as? NavigationFlowExternalState ?: throw PlayerException("ExternalActionPlugin Could not deserialize $state")
                val controllerState = options.deserialize(ControllerState.serializer())

                runtime.Promise<Any> { resolve, _ ->
                    handlerConfig.handler.onExternalAction(externalState, controllerState, resolve)
                }
            }

            // Return [match, callback] tuple
            listOf(handlerConfig.match, callback)
        }

        runtime.add("externalActionHandlers", jsHandlers)
        instance = runtime.buildInstance("(new $name(externalActionHandlers))")
    }

    private companion object {
        private const val PLUGIN_NAME = "ExternalActionPlugin.ExternalActionPlugin"
        private const val BUNDLED_SOURCE_PATH = "plugins/external-action/core/dist/ExternalActionPlugin.native.js"
    }
}

/** Convenience getter to find the first [ExternalActionPlugin] registered to the [Player] */
public val Player.externalActionPlugin: ExternalActionPlugin? get() = findPlugin()
