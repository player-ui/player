package com.intuit.playerui.jsi.promise

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.Promise
import com.intuit.playerui.core.bridge.toCompletable
import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.plugins.settimeout.SetTimeoutPlugin
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class JSIPromiseTest : HermesTest(HermesRuntime.create().apply(SetTimeoutPlugin()::apply)) {

    @Test
    fun testErrorStacktraceFromJSError() {
        val (promiseInstance) = runtime.execute(
            """
           (function() {
               var resolver;
               const promise = new Promise(function(resolve, reject) { asdf.asdf.asdf.asdf });
               return [promise, resolver];
           })();
            """.trimIndent(),
        ) as List<*>

        val promise = Promise(promiseInstance as Node).thenRecord.catchRecord
        catchChain.filterIsInstance<Throwable>().forEach { it.printStackTrace() }

        runBlocking {
            suspendCancellableCoroutine { continuation ->
                promise.toCompletable<Any>().onComplete(continuation::resumeWith)
            }
        }

        catchChain.filterIsInstance<Throwable>().forEach { it.printStackTrace() }

        assertCatch("ReferenceError: Property 'asdf' doesn't exist")
        assertThen()

        val exception = catchChain[0] as Throwable
        Assertions.assertEquals(
            """com.intuit.playerui.core.bridge.JSErrorException: ReferenceError: Property 'asdf' doesn't exist
	at .anonymous(unknown:3)
	at .tryCallTwo(address at InternalBytecode.js:1)
	at .doResolve(address at InternalBytecode.js:1)
	at .Promise(address at InternalBytecode.js:1)
	at .anonymous(unknown:3)
	at .global(unknown:5)
""",
            exception.stackTraceToString(),
        )
    }
}
