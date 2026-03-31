package com.intuit.playerui.graaljs.extensions

import com.intuit.playerui.core.bridge.PlayerRuntimeReleasedException.Companion.ensureNotReleased
import com.intuit.playerui.graaljs.bridge.runtime.GraalRuntime.Companion.runtime
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.Value

/**
 * Synchronized method to execute [block] on the Graal [Value]. To prevent deadlock, this
 * lock will only wait for [timeout] milliseconds, defaulting to 5000.
 *
 * NOTE: Suspend methods are non-blocking by convention.
 */
internal suspend fun <T> Value.lock(timeout: Long = 5000, block: suspend Value.() -> T): T = withTimeout(timeout) {
    context.runtime.ensureNotReleased {
        val runtimeLock = context.runtime.lock
        val alreadyHadLock = runtimeLock.isHeldByCurrentThread
        try {
            while (!runtimeLock.tryLock()) delay(50)
            block()
        } finally {
            if (!alreadyHadLock && runtimeLock.isHeldByCurrentThread) runtimeLock.unlock()
        }
    }
}

/**
 * Synchronized method to execute [block] on the Graal [Context]. To prevent deadlock, this
 * lock will only wait for [timeout] milliseconds, defaulting to 5000.
 *
 * NOTE: Suspend methods are non-blocking by convention.
 */
internal suspend fun <T> Context.lock(timeout: Long = 5000, block: suspend Context.() -> T): T = withTimeout(timeout) {
    runtime.ensureNotReleased {
        val runtimeLock = runtime.lock
        val alreadyHadLock = runtimeLock.isHeldByCurrentThread
        try {
            while (!runtimeLock.tryLock()) delay(50)
            block()
        } finally {
            if (!alreadyHadLock && runtimeLock.isHeldByCurrentThread) runtimeLock.unlock()
        }
    }
}

/**
 * Blocking method to execute [block] on the Graal [Value]. This
 * will block the calling thread.
 */
internal fun <T> Value.blockingLock(block: Value.() -> T): T = when {
    context.runtime.lock.isHeldByCurrentThread -> block()
    else -> runBlocking { context.runtime.ensureNotReleased { lock { block() } } }
}

/**
 * Blocking method to execute [block] on the Graal [Context]. This
 * will block the calling thread.
 */
internal fun <T> Context.blockingLock(block: Context.() -> T): T = when {
    runtime.lock.isHeldByCurrentThread -> block()
    else -> runBlocking { runtime.ensureNotReleased { lock { block() } } }
}

/** Special [blockingLock] helper to guard against undefined values */
internal fun <T> Value.lockIfDefined(block: Value.() -> T): T? = mapUndefinedToNull()?.let { blockingLock(block) }

internal fun Value.mapUndefinedToNull() = blockingLock {
    if (isNull) null else this
}
