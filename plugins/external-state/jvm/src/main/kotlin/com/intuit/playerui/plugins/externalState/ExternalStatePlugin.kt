package com.intuit.playerui.plugins.externalState

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

public typealias ExternalStateHandlerMatch = Map<String, Any>

public data class ExternalStateHandler(
    val ref: String,
    val match: ExternalStateHandlerMatch? = null,
    val handlerFunction: Function,
) {
    /**
     * Function definition of an external state handler
     * @param state The NavigationFlowExternalState that was transitioned to
     * @param options The ControllerState providing access to data and expression evaluation
     * @param transition Callback to transition to the next state
     */
    public fun interface Function {
        public operator fun invoke(
            state: NavigationFlowExternalState,
            options: ControllerState,
            transition: (String) -> Unit,
        )
    }
}

/**
 * Core plugin wrapper providing external state support for the JVM Player.
 *
 * This plugin uses a registry-based approach to match external states to handler functions.
 * Multiple handlers can be registered, and handlers are matched using partial object matching
 * with specificity ordering (more specific matches take precedence).
 *
 * @param handlers List of handler configurations with matchers and handler functions.
 */
public class ExternalStatePlugin(
    vararg handlers: ExternalStateHandler,
) : JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH),
    PlayerPlugin {
    private lateinit var player: Player
    private val handlers: List<ExternalStateHandler> = handlers.toList()

    override fun apply(player: Player) {
        this.player = player
    }

    override fun apply(runtime: Runtime<*>) {
        SetTimeoutPlugin().apply(runtime)
        runtime.load(ScriptContext(script, BUNDLED_SOURCE_PATH))

        // Build array of { ref, match, handlerFunction } objects for JavaScript
        val jsHandlers = handlers.map { handlerConfig ->
            val callback: (Node, Node) -> Any? = callback@{ state, options ->
                val externalState = state.deserialize(NavigationFlowState.serializer())
                    as? NavigationFlowExternalState ?: throw PlayerException("ExternalStatePlugin Could not deserialize $state")
                val controllerState = options.deserialize(ControllerState.serializer())

                runtime.Promise<Any> { resolve, _ ->
                    handlerConfig.handlerFunction(externalState, controllerState, resolve)
                }
            }

            mapOf(
                "ref" to handlerConfig.ref,
                "match" to handlerConfig.match,
                "handlerFunction" to callback,
            )
        }

        runtime.add("externalStateHandlers", jsHandlers)
        instance = runtime.buildInstance("(new $name(externalStateHandlers))")
    }

    private companion object {
        private const val PLUGIN_NAME = "ExternalStatePlugin.ExternalStatePlugin"
        private const val BUNDLED_SOURCE_PATH = "plugins/external-state/core/dist/ExternalStatePlugin.native.js"
    }
}

/** Convenience getter to find the first [ExternalStatePlugin] registered to the [Player] */
public val Player.externalStatePlugin: ExternalStatePlugin? get() = findPlugin()
