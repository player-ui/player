package com.intuit.playerui.graaljs.promise

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.Promise
import com.intuit.playerui.graaljs.base.GraalTest
import com.intuit.playerui.utils.test.PromiseUtils
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class GraalPromiseTest : GraalTest(), PromiseUtils {

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
        assertEquals(
            """com.intuit.playerui.core.bridge.JSErrorException: ReferenceError: asdf is not defined
	at .promise(Unnamed:3)
	at .new Promise(Native Method)
	at .(Unnamed:3)
	at .(Unnamed:1)
""",
            exception.stackTraceToString(),
        )
    }
}
