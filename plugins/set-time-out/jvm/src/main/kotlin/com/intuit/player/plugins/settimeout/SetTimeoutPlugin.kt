package com.intuit.player.plugins.settimeout

import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.runtime.add
import com.intuit.player.jvm.core.player.Player
import com.intuit.player.jvm.core.player.state.inProgressState
import com.intuit.player.jvm.core.plugins.PlayerPlugin
import com.intuit.player.jvm.core.plugins.PlayerPluginException
import com.intuit.player.jvm.core.plugins.RuntimePlugin
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** [RuntimePlugin] that adds a `setTimeout` implementation into a the [Runtime] if it doesn't exist */
public class SetTimeoutPlugin(private val exceptionHandler: CoroutineExceptionHandler? = null) :
    RuntimePlugin, PlayerPlugin {

    private var player: Player? = null

    override fun apply(runtime: Runtime<*>) {
        if (!runtime.contains("setTimeout")) runtime.add("setTimeout") { callback: Invokable<Any?>, timeout: Double ->
            runtime.scope.launch(
                exceptionHandler ?: CoroutineExceptionHandler { _, exception ->
                    PlayerPluginException(
                        "SetTimeoutPlugin",
                        "Exception throw during setTimeout invocation",
                        exception
                    ).let {
                        player?.inProgressState?.fail(it) ?: throw it
                    }
                }
            ) {
                delay(timeout.toLong())
                callback()
            }
            return@add
        }
    }

    override fun apply(player: Player) {
        this.player = player
    }
}
