package com.intuit.playerui.jsi.promise

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.Promise
import com.intuit.playerui.hermes.base.HermesTest
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class JSIPromiseTest : HermesTest() {

    @Test
    fun testErrorStacktraceFromJSError() {
        val (promise) = runtime.execute(
            """
           (function a() {
               var resolver;
               const promise = new Promise(function(resolve, reject) { asdf.asdf.asdf.asdf });
               return [promise, resolver];
           })();
            """.trimIndent(),
        ) as List<*>

        Promise(promise as Node).thenRecord.catchRecord

        catchChain.filterIsInstance<Throwable>().forEach { it.printStackTrace() }

        assertCatch("ReferenceError: asdf is not defined")
        assertThen()

        val exception = catchChain[0] as Throwable
        Assertions.assertEquals(
            """com.intuit.playerui.core.bridge.JSErrorException: ReferenceError: asdf is not defined
	at .(<anonymous>:3)
	at .new Promise(Native Method)
	at .(<anonymous>:3)
	at .(<anonymous>:5)
""",
            exception.stackTraceToString(),
        )
    }
}
