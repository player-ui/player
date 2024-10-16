package com.intuit.playerui.plugins.settimeout

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.plugins.PlayerPlugin
import com.intuit.playerui.core.plugins.PlayerPluginException
import com.intuit.playerui.core.plugins.RuntimePlugin
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** [RuntimePlugin] that adds a `setTimeout` implementation into a the [Runtime] if it doesn't exist */
public class SetTimeoutPlugin(private val exceptionHandler: CoroutineExceptionHandler? = null, private val override: Boolean = false) :
    RuntimePlugin, PlayerPlugin {

    private var player: Player? = null

    @OptIn(ExperimentalPlayerApi::class)
    override fun apply(runtime: Runtime<*>) {
        if (override || !runtime.contains("setTimeout")) {
            runtime.add("setTimeout") { callback: Invokable<Any?>, timeout: Long ->
                runtime.scope.launch(
                    exceptionHandler ?: runtime.config.coroutineExceptionHandler ?: CoroutineExceptionHandler { context, exception ->
                        val wrapped = PlayerPluginException(
                            "SetTimeoutPlugin",
                            "Exception throw during setTimeout invocation",
                            exception,
                        )

                        runtime.config.coroutineExceptionHandler?.handleException(context, wrapped)
                            ?: player?.inProgressState?.fail(wrapped)
                            ?: throw wrapped
                    },
                ) {
                    delay(timeout)
                    callback()
                }
                return@add
            }
        }

        if (override || !runtime.contains("setImmediate")) {
            runtime.add("setImmediate", runtime.executeRaw("(callback => setTimeout(callback, 0))"))
        }
    }

    override fun apply(player: Player) {
        this.player = player
    }
}
