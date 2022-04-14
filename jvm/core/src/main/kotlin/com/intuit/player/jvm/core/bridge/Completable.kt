package com.intuit.player.jvm.core.bridge

import kotlinx.coroutines.flow.Flow
import kotlin.Result

// TODO: Can this extend or be replaced with [Deferred]?
/** Asynchronous construct that provides a way to obtain the result directly, as a flow, or within a callback */
public interface Completable<T> {

    /** Await for value directly */
    public suspend fun await(): T

    /** Consume value as a [Flow] */
    public suspend fun asFlow(): Flow<T>

    /** Subscribe to value with an explicit completion handler */
    public fun onComplete(block: (Result<T>) -> Unit)
}
