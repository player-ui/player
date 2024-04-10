package com.intuit.playerui.utils

import com.intuit.playerui.core.bridge.Completable
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.flow.Flow
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.state.CompletedState
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement

/**
 * Helper method to [start] a [flow] represented as a [JsonElement]. This exists in the
 * utils package b/c it depends on the [stringify] helper defined in this package.
 */
@ExperimentalPlayerApi
public fun Player.start(flow: JsonElement, onComplete: ((Result<CompletedState>) -> Unit)? = null): Completable<CompletedState> =
    onComplete?.let { start(flow.stringify(), onComplete) } ?: start(flow.stringify())

/** Helper method to [start] a [flow] represented as a [Flow] */
@ExperimentalPlayerApi
public fun Player.start(flow: Flow, onComplete: ((Result<CompletedState>) -> Unit)? = null): Completable<CompletedState> = onComplete
    ?.let { start(Json.encodeToString(Flow.serializer(), flow), onComplete) }
    ?: start(Json.encodeToString(Flow.serializer(), flow))
