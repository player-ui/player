package com.intuit.playerui.hermes.extensions

import com.intuit.playerui.core.bridge.PlayerRuntimeException
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.hermes.extensions.RuntimeThreadContext.Key.currentThreadRuntimeThreadContext
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlin.coroutines.CoroutineContext
import kotlin.coroutines.cancellation.CancellationException
import kotlin.coroutines.coroutineContext

@DslMarker
@Target(AnnotationTarget.CLASS, AnnotationTarget.TYPE)
public annotation class RuntimeThreadContextMarker

@RuntimeThreadContextMarker
public sealed interface RuntimeThreadContext : CoroutineContext.Element {
    override val key: CoroutineContext.Key<RuntimeThreadContext> get() = Key
    public companion object Key : CoroutineContext.Key<RuntimeThreadContext> {
        internal val currentThreadRuntimeThreadContext: ThreadLocal<RuntimeThreadContext> = ThreadLocal()
    }
}

@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION, AnnotationTarget.PROPERTY, AnnotationTarget.CONSTRUCTOR)
@RequiresOptIn(message = "This API needs to be executed on the dedicated JS thread, which isn't guaranteed int this context. If you opt-in, make sure you understand where this code is being executed.", level = RequiresOptIn.Level.ERROR)
public annotation class UnsafeRuntimeThreadAPI

@UnsafeRuntimeThreadAPI
internal object UnsafeRuntimeThreadContext : RuntimeThreadContext

internal abstract class DedicatedRuntimeThreadContext internal constructor(): RuntimeThreadContext {
    companion object : DedicatedRuntimeThreadContext()
}

private fun Runtime<*>.ensureNotReleased() {
    if (runtime.isReleased()) throw PlayerRuntimeException(runtime, "Runtime object has been released!")
}

internal suspend fun <T> Runtime<*>.evaluateInJSThread(
    block: suspend RuntimeThreadContext.() -> T
): T {
    ensureNotReleased()
    val currentRuntimeThreadContext = coroutineContext[RuntimeThreadContext]
    // TODO: Put Dedicated Runtime Thread Context in the dispatcher context if we can?
    return if (currentRuntimeThreadContext != null) block(currentRuntimeThreadContext) else withContext(runtime.dispatcher + DedicatedRuntimeThreadContext) {
        val runtimeThreadContext = coroutineContext[RuntimeThreadContext] ?: throw PlayerRuntimeException(runtime, "In this context, we should always have a RuntimeThreadContext")
        currentThreadRuntimeThreadContext.set(runtimeThreadContext)
        block(runtimeThreadContext)
    }
}

internal fun <T> Runtime<*>.evaluateInJSThreadBlocking(
    block: RuntimeThreadContext.() -> T
): T {
    ensureNotReleased()
    val currentRuntimeThreadContext = currentThreadRuntimeThreadContext.get()
    return if (currentRuntimeThreadContext != null) block(currentRuntimeThreadContext) else try {
        runBlocking {
            evaluateInJSThread { block() }
        }
    } catch (throwable: Throwable) {
        if (throwable is CancellationException) throw throwable
        // rethrow outside coroutine to capture stack before continuation
        throw PlayerRuntimeException(runtime, "Exception caught evaluating JS", throwable)
    }
}

@UnsafeRuntimeThreadAPI
internal fun <T> evaluateInCurrentThread(
    block: RuntimeThreadContext.() -> T
): T = block(UnsafeRuntimeThreadContext)
