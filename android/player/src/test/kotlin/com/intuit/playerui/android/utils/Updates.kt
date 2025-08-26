package com.intuit.playerui.android.utils

import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.utils.start
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.json.JsonElement
import kotlin.coroutines.resume

internal sealed class Update {
    data class Asset(val asset: RenderableAsset?, val index: Int) : Update()
    data class State(val state: PlayerFlowState) : Update()
}

internal suspend fun AndroidPlayer.awaitFirstView(flow: JsonElement): RenderableAsset? =
    suspendCancellableCoroutine { cont ->
        onUpdate { asset, _ -> cont.resume(asset) }
        start(flow)
    }

internal fun AndroidPlayer.updates(flow: JsonElement, take: Int = 1) = updates(flow.stringify(), take)
internal fun AndroidPlayer.updates(flow: String, take: Int = 1): Flow<Update> = callbackFlow {
    var count = 0
    onUpdate { asset, _ ->
        trySend(Update.Asset(asset, count)).isSuccess
        if (++count >= take) close()
    }

    hooks.state.tap { state ->
        trySend(Update.State(state ?: ErrorState.from("state was null"))).isSuccess
    }

    start(flow).onComplete {
        close(
            it.exceptionOrNull() ?: if (count != take) {
                PlayerException("did not meet expected asset updates ($count != $take)")
            } else {
                null
            },
        )
    }

    awaitClose { cancel() }
}
