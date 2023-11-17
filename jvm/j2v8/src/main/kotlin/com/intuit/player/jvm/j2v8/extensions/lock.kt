package com.intuit.player.jvm.j2v8.extensions

import com.eclipsesource.v8.V8Value
import com.intuit.player.jvm.core.bridge.PlayerRuntimeException
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout

internal suspend fun <Context : V8Value, T> Context.evaluateInJSThread(
    runtime: Runtime<V8Value>,
    timeout: Long = 5000,
    block: suspend Context.() -> T
): T = withTimeout(timeout) {
    if (runtime.isReleased()) throw PlayerRuntimeException(runtime, "Runtime object has been released!")
    withContext(runtime.dispatcher) {
        runtime.scope.ensureActive()
        block()
    }
}

internal fun <Context : V8Value, T> Context.evaluateInJSThreadBlocking(
    runtime: Runtime<V8Value>,
    timeout: Long = 5000,
    block: Context.() -> T
): T {
    if (runtime.isReleased()) throw PlayerRuntimeException(runtime, "Runtime object has been released!")
    // if we're already on the dispatcher thread, DON'T BLOCK
    return if (this@evaluateInJSThreadBlocking.runtime.locker.hasLock()) block() else {
        runtime.checkBlockingThread(Thread.currentThread())
        runBlocking {
            evaluateInJSThread(runtime, timeout, block)
        }
    }
}

internal suspend fun <Context : V8Value, T> Context.evaluateInJSThreadIfDefined(
    runtime: Runtime<V8Value>,
    timeout: Long = 5000,
    block: suspend Context.() -> T,
): T? = mapUndefinedToNull()?.let { evaluateInJSThread(runtime, timeout, block) }

internal fun <Context : V8Value, T> Context.evaluateInJSThreadIfDefinedBlocking(
    runtime: Runtime<V8Value>,
    timeout: Long = 5000,
    block: Context.() -> T,
): T? = mapUndefinedToNull()?.let { evaluateInJSThreadBlocking(runtime, timeout, block) }
