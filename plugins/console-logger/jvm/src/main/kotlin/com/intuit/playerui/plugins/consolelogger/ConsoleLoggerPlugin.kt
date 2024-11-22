package com.intuit.playerui.plugins.consolelogger

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.LoggerPlugin
import com.intuit.playerui.core.plugins.PlayerPlugin
import com.intuit.playerui.core.plugins.RuntimePlugin

/** [RuntimePlugin] that adds a `console.log` implementation into a the [Runtime] if it doesn't exist */
public class ConsoleLoggerPlugin(private val logger: LoggerPlugin? = null, private val override: Boolean = false) :
    RuntimePlugin, PlayerPlugin {

    private var player: Player? = null

    @OptIn(ExperimentalPlayerApi::class)
    override fun apply(runtime: Runtime<*>) {
        if (override || !runtime.contains("console")) {
            runtime.add("console", mapOf(
                "log" to Invokable { args ->
                    logger?.debug(*args) ?: printToConsole(*args)
                },
                "debug" to Invokable { args ->
                    logger?.debug(*args) ?: printToConsole(*args)
                },
                "warn" to Invokable { args ->
                    logger?.warn(*args) ?: printToConsole(*args)
                },
                "info" to Invokable { args ->
                    logger?.info(*args) ?: printToConsole(*args)
                },
                "error" to Invokable { args ->
                    logger?.error(*args) ?: printToConsole(*args)
                },
                "trace" to Invokable { args ->
                    logger?.trace(*args) ?: printToConsole(*args)
                },
            ))
        }
    }

    private fun printToConsole(vararg args: Any?) {

    }

    override fun apply(player: Player) {
        this.player = player
    }
}
