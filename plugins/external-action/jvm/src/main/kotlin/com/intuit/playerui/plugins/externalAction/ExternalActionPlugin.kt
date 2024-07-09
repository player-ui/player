package com.intuit.playerui.plugins.externalAction

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.Promise
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.flow.state.NavigationFlowExternalState
import com.intuit.playerui.core.flow.state.NavigationFlowState
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.state.ControllerState
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.PlayerPlugin
import com.intuit.playerui.core.plugins.findPlugin
import com.intuit.playerui.plugins.settimeout.SetTimeoutPlugin

/** Function definition of an external action handler */
public fun interface ExternalActionHandler {
    public fun onExternalState(state: NavigationFlowExternalState, options: ControllerState, transition: (String) -> Unit)
}

/** Core plugin wrapper providing external action support for the JVM Player */
public class ExternalActionPlugin(
    private var handler: ExternalActionHandler? = null,
) : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath), PlayerPlugin {

    private lateinit var player: Player

    override fun apply(player: Player) {
        this.player = player
    }

    override fun apply(runtime: Runtime<*>) {
        SetTimeoutPlugin().apply(runtime)
        runtime.load(ScriptContext(if (runtime.config.debuggable) debugScript else script, bundledSourcePath))
        runtime.add("externalActionHandler") externalActionHandler@{ state: Node, options: Node ->
            val state = state.deserialize(NavigationFlowState.serializer())
                as? NavigationFlowExternalState ?: return@externalActionHandler null
            val options = options.deserialize(ControllerState.serializer())

            return@externalActionHandler runtime.Promise<Any> { resolve, _ ->
                handler?.onExternalState(state, options, resolve)
            }
        }
        instance = runtime.buildInstance("""(new $name(externalActionHandler))""")
    }

    /** Register handler for external action navigation nodes */
    public fun onExternalAction(handler: ExternalActionHandler) {
        this.handler = handler
    }

    private companion object {
        private const val pluginName = "ExternalActionPlugin.ExternalActionPlugin"
        private const val bundledSourcePath = "plugins/external-action/core/dist/ExternalActionPlugin.native.js"
    }
}

/** Convenience getter to find the first [ExternalActionPlugin] registered to the [Player] */
public val Player.externalActionPlugin: ExternalActionPlugin? get() = findPlugin()

/** Convenience method for registering an external action handler without a reference to the [ExternalActionPlugin] */
public fun Player.onExternalAction(handler: ExternalActionHandler) {
    externalActionPlugin?.onExternalAction(handler)
}
