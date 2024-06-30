package com.intuit.playerui.jsi.promise

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.Promise
import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.hermes.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.jsi.Function
import com.intuit.playerui.jsi.HostFunction
import com.intuit.playerui.jsi.Value
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class JSIPromiseTest : HermesTest() {

    @Test
    fun testErrorStacktraceFromJSError() = runtime.evaluateInJSThreadBlocking {
        runtime.global().setProperty(runtime, "setTimeout", Function.createFromHostFunction(runtime, "setTimeout", 2, HostFunction { runtime, thisVal, args ->
            val callback = args[0].asObject(runtime).asFunction(runtime)
            val timeout = args.getOrElse(1) { Value.from(0) }.asNumber().toLong()

            val runTask = {
                if (thisVal.isObject()) callback.callWithThis(runtime, thisVal.asObject(runtime), *args)
                else callback.call(runtime, *args)
            }

            if (timeout == 0L) {
                runTask()
            } else (runtime as HermesRuntime).scope.launch {
                delay(timeout)
                runTask()
            }

            Value.undefined
        }).asValue(runtime))
        runtime.global().setProperty(runtime, "setImmediate", runtime.evaluateJavaScript("""((callback) => setTimeout(callback, 0))"""))
//        // ev -> runtime.drainMicrotasks()

        val (promise) = runtime.execute(
            """
           (function() {
               var resolver;
               const promise = new Promise(function(resolve, reject) { asdf.asdf.asdf.asdf });
               return [promise, resolver];
           })();
            """.trimIndent(),
        ) as List<*>

        Promise(promise as Node).thenRecord.catchRecord

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
