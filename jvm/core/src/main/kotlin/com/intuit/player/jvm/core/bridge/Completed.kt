package com.intuit.player.jvm.core.bridge

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlin.Result
import kotlin.Result.Companion.success

/** Utility class to wrap a [value] as a [Completable] */
public class Completed<T>(public val value: T) : Completable<T> {
    override suspend fun asFlow(): Flow<T> = flowOf(value)
    override suspend fun await(): T = value
    override fun onComplete(block: (Result<T>) -> Unit): Unit = block(success(value))
}
