package com.intuit.player.jvm.j2v8.promise

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.Promise
import com.intuit.player.jvm.j2v8.base.J2V8Test
import com.intuit.player.jvm.utils.test.PromiseUtils
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class V8PromiseTest : J2V8Test(), PromiseUtils {

    override val thenChain = mutableListOf<Any?>()
    override val catchChain = mutableListOf<Any?>()

    @Test
    fun testErrorStacktraceFromJSError() {
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

        assertCatch("ReferenceError: asdf is not defined")
        assertThen()

        val exception = catchChain[0] as Throwable
        Assertions.assertEquals(
            """com.intuit.player.jvm.core.bridge.JSErrorException: ReferenceError: asdf is not defined
	at .(<anonymous>:3)
	at .new Promise(Native Method)
	at .(<anonymous>:3)
	at .(<anonymous>:5)
""",
            exception.stackTraceToString(),
        )
    }
}
