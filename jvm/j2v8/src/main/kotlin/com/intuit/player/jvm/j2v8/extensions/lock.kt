package com.intuit.player.jvm.j2v8.extensions

import com.eclipsesource.v8.V8Value
import com.intuit.player.jvm.j2v8.bridge.runtime.PlayerRuntimeException
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout

/**
 * Wait for lock and execute [block]. After execution, or on exception, the lock will be released
 * unless the lock was already acquired within the calling context. To prevent deadlock, this
 * lock will only wait for [timeout] milliseconds, defaulting to 5000.
 *
 * NOTE: Suspend methods are non-blocking by convention.
 */
internal suspend fun <Context : V8Value, T> Context.lock(timeout: Long = 5000, block: suspend Context.() -> T): T = withTimeout(timeout) {
    if (isReleased) throw PlayerRuntimeException(runtime, "Runtime object has been released!")
    val alreadyHadLock = runtime.locker.hasLock()
    try {
        while (!runtime.locker.tryAcquire()) delay(50)
        block()
    } finally {
        if (!alreadyHadLock && runtime.locker.hasLock()) runtime.locker.release()
    }
}

/**
 * Blocking method to execute [block]. If the calling context does not have the lock
 * then the lock will attempt to be acquired through delegation to [lock]. This
 * will continue to block the calling thread.
 */
internal fun <Context : V8Value, T> Context.blockingLock(block: Context.() -> T): T = when {
    isReleased -> throw PlayerRuntimeException(runtime, "Runtime object has been released!")
    runtime.locker.hasLock() -> block()
    else -> runBlocking {
        lock { block() }
    }
}

/** Special [blockingLock] helper to guard against undefined values */
internal fun <Context : V8Value, T> Context.lockIfDefined(
    block: Context.() -> T
): T? = mapUndefinedToNull()?.let { blockingLock(block) }
