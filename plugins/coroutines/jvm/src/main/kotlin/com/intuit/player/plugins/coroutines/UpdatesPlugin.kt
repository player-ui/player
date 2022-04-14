package com.intuit.player.plugins.coroutines

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.player.Player
import com.intuit.player.jvm.core.player.state.ReleasedState
import com.intuit.player.jvm.core.plugins.PlayerPlugin
import com.intuit.player.jvm.core.plugins.findPlugin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.channels.ReceiveChannel

/** [PlayerPlugin] that converts view updates to a [ReceiveChannel] and provides functionality for waiting for an update */
public class UpdatesPlugin : PlayerPlugin {

    private val scope: CoroutineScope = CoroutineScope(Dispatchers.Default)

    private val _updates: Channel<Asset?> = Channel()

    public val updates: ReceiveChannel<Asset?> by ::_updates

    /** Block until a *new* update is received or the [timeout] is reached */
    @JvmOverloads public fun waitForUpdates(timeout: Long = 500): Asset? = runBlocking {
        flush()
        withTimeout(timeout) {
            updates.receive()
        }
    }

    /** Receive all updates until [updates] is empty */
    @OptIn(ExperimentalCoroutinesApi::class)
    public fun flush() {
        runBlocking {
            while (!updates.isEmpty) {
                updates.receive()
            }
        }
    }

    override fun apply(player: Player) {
        player.hooks.viewController.tap { vc ->
            vc?.hooks?.view?.tap { v ->
                v?.hooks?.onUpdate?.tap { asset ->
                    scope.launch {
                        _updates.send(asset)
                    }
                }
            }
        }

        player.hooks.state.tap { state ->
            if (state is ReleasedState) scope.cancel()
        }
    }
}

public val Player.updatesPlugin: UpdatesPlugin? get() = findPlugin()

@JvmOverloads public fun Player.waitForUpdates(timeout: Long = 500): Asset? = updatesPlugin?.waitForUpdates(timeout)
