package com.intuit.playerui.hermes.extensions

import com.intuit.playerui.core.bridge.PlayerRuntimeException
import com.intuit.playerui.core.bridge.PlayerRuntimeReleasedException
import com.intuit.playerui.core.bridge.PlayerRuntimeReleasedException.Companion.ensureNotReleased
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

// TODO: Would be nice if this could be used to dynamically retrieve associated runtime, or maybe we could pull it from a thread local
@RuntimeThreadContextMarker
public sealed interface RuntimeThreadContext : CoroutineContext.Element {
    override val key: CoroutineContext.Key<RuntimeThreadContext> get() = Key

    public companion object Key : CoroutineContext.Key<RuntimeThreadContext> {
        internal val currentThreadRuntimeThreadContext: ThreadLocal<RuntimeThreadContext> = ThreadLocal()
    }
}

@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION, AnnotationTarget.PROPERTY, AnnotationTarget.CONSTRUCTOR)
@RequiresOptIn(
    message =
        "This API needs to be executed on the dedicated JS thread, which isn't guaranteed int this context. If you opt-in, make sure you understand where this code is being executed.",
    level = RequiresOptIn.Level.ERROR,
)
public annotation class UnsafeRuntimeThreadAPI

@UnsafeRuntimeThreadAPI
internal object UnsafeRuntimeThreadContext : RuntimeThreadContext

internal abstract class DedicatedRuntimeThreadContext internal constructor() : RuntimeThreadContext {
    companion object : DedicatedRuntimeThreadContext()
}

internal suspend fun <T> Runtime<*>.evaluateInJSThread(block: suspend RuntimeThreadContext.() -> T): T {
    val currentRuntimeThreadContext = coroutineContext[RuntimeThreadContext]
    // TODO: Put Dedicated Runtime Thread Context in the dispatcher context if we can?
    return if (currentRuntimeThreadContext != null) {
        ensureNotReleased { block(currentRuntimeThreadContext) }
    } else {
        withContext(runtime.dispatcher + DedicatedRuntimeThreadContext) {
            val runtimeThreadContext = coroutineContext[RuntimeThreadContext]
                ?: throw PlayerRuntimeException("In this context, we should always have a RuntimeThreadContext")
            currentThreadRuntimeThreadContext.set(runtimeThreadContext)
            ensureNotReleased { block(runtimeThreadContext) }
        }
    }
}

internal fun <T> Runtime<*>.evaluateInJSThreadBlocking(muteLog: Boolean = false, block: RuntimeThreadContext.() -> T): T {
    val currentRuntimeThreadContext = currentThreadRuntimeThreadContext.get()
    return if (currentRuntimeThreadContext != null) {
        block(currentRuntimeThreadContext)
    } else {
        try {
            if (!muteLog) runtime.checkBlockingThread(Thread.currentThread())
            runBlocking {
                ensureNotReleased { evaluateInJSThread { block() } }
            }
        } catch (throwable: Throwable) {
            if (throwable is CancellationException) throw throwable
            if (throwable is PlayerRuntimeReleasedException) throw throwable
            // rethrow outside coroutine to capture stack before continuation
            throw PlayerRuntimeException("Exception caught evaluating JS", throwable)
        }
    }
}

@UnsafeRuntimeThreadAPI
internal fun <T> evaluateInCurrentThread(block: RuntimeThreadContext.() -> T): T = block(UnsafeRuntimeThreadContext)
