package com.intuit.playerui.j2v8.extensions

import com.eclipsesource.v8.V8Value
import com.intuit.playerui.core.bridge.PlayerRuntimeException
import com.intuit.playerui.core.bridge.runtime.Runtime
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout

internal suspend fun <Context : V8Value, T> Context.evaluateInJSThread(runtime: Runtime<V8Value>, block: suspend Context.() -> T): T =
    withTimeout(runtime.config.timeout) {
        if (runtime.isReleased()) throw PlayerRuntimeException(runtime, "Runtime object has been released!")
        withContext(runtime.dispatcher) {
            runtime.scope.ensureActive()
            block()
        }
    }

internal fun <Context : V8Value, T> Context.evaluateInJSThreadBlocking(
    runtime: Runtime<V8Value>,
    muteLog: Boolean = false,
    block: Context.() -> T,
): T {
    if (runtime.isReleased()) throw PlayerRuntimeException(runtime, "Runtime object has been released!")
    // if we're already on the dispatcher thread, DON'T BLOCK
    return if (this@evaluateInJSThreadBlocking.runtime.locker.hasLock()) {
        block()
    } else {
        if (!muteLog) runtime.checkBlockingThread(Thread.currentThread())
        runBlocking {
            evaluateInJSThread(runtime, block)
        }
    }
}

internal suspend fun <Context : V8Value, T> Context.evaluateInJSThreadIfDefined(
    runtime: Runtime<V8Value>,
    block: suspend Context.() -> T,
): T? = mapUndefinedToNull()?.let { evaluateInJSThread(runtime, block) }

internal fun <Context : V8Value, T> Context.evaluateInJSThreadIfDefinedBlocking(runtime: Runtime<V8Value>, block: Context.() -> T): T? =
    mapUndefinedToNull()?.let { evaluateInJSThreadBlocking(runtime, false, block) }
