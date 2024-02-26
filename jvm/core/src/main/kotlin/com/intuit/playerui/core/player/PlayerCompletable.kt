package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.Completable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.Promise
import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.core.player.state.PlayerFlowState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

internal class PlayerCompletable(private val completable: Completable<PlayerFlowState?>) : Completable<CompletedState> {

    constructor(promise: Node) : this(Promise(promise))

    constructor(promise: Promise) : this(promise.toCompletable(PlayerFlowState.serializer()))

    private fun verifySuccess(state: PlayerFlowState?) = when (state) {
        is CompletedState -> state
        is ErrorState -> throw state.error
        else -> throw PlayerException("expected CompletedState instead of $state")
    }

    override suspend fun asFlow(): Flow<CompletedState> = completable
        .asFlow()
        .map { verifySuccess(it) }

    override suspend fun await(): CompletedState = verifySuccess(completable.await())

    override fun onComplete(block: (Result<CompletedState>) -> Unit) {
        completable.onComplete { result -> result.mapCatching { verifySuccess(it) }.let(block) }
    }
}
