package com.intuit.playerui.core.bridge

import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.PlayerFlowStatus
import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.utils.normalizeStackTraceElements
import com.intuit.playerui.utils.test.PromiseUtils
import com.intuit.playerui.utils.test.RuntimeTest
import com.intuit.playerui.utils.test.runBlockingTest
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate

private inline fun currentStackTrace() = Exception().stackTrace

internal class PromiseTest : RuntimeTest(), PromiseUtils {

    override val thenChain = mutableListOf<Any?>(); get() = runBlocking {
        // TODO: Rework delay into a proper suspension mechanism
        delay(100)
        field
    }

    override val catchChain = mutableListOf<Any?>(); get() = runBlocking {
        // TODO: Rework delay into a proper suspension mechanism
        delay(100)
        field
    }

    /**
     * Anti-test case since old test existed to prove the Json conversions forced Ints as Longs.
     */
    @TestTemplate
    fun testIntToLong() = with(runtime) {
        Promise.resolve(42)
            .thenRecord
            .then<Any> { listOf(42) }
            .thenRecord
            .catchRecord

        assertCatch()
        assertThen(42, listOf(42))
    }

    @TestTemplate
    fun testThenCatchChainWithSimpleTypes() {
        val list = listOf(1, 2, 3)
        val mapFlow = mapOf("outcome" to "doneWithTopic")

        runtime.Promise.resolve(42)
            .thenRecord
            .then<Any> { null }
            .thenRecord
            .then<Any> { Unit }
            .thenRecord
            .then<Any> { list }
            .thenRecord
            .then<Any> { mapFlow }
            .thenRecord
            .then<Any> { throw IllegalStateException("wtf") }
            .thenRecord
            .catchRecord
            .then<Any> { 42 }
            .thenRecord
            .catchRecord

        assertThen(42, null, null, list, mapFlow, 42)
        assertCatch("wtf")
    }

    @TestTemplate
    fun testThenCatchChainWithExplicitSerializers() {
        val jsonFlow = buildJsonObject {
            put("status", PlayerFlowStatus.COMPLETED.value)
            put(
                "flowResult",
                buildJsonObject {
                    put("outcome", "doneWithTopic")
                },
            )
            put(
                "flow",
                buildJsonObject {
                    put("id", "some-id")
                },
            )
        }
        val flow = CompletedState(
            runtime.serialize(
                mapOf(
                    "status" to PlayerFlowStatus.COMPLETED.value,
                    "flowResult" to mapOf(
                        "outcome" to "doneWithTopic",
                    ),
                    "flow" to mapOf(
                        "id" to "some-id",
                    ),
                ),
            ) as Node,
        )

        runtime.Promise.resolve(42)
            .then<Any> { jsonFlow }
            .thenRecord(JsonElement.serializer())
            .then<Any> { flow }
            .thenRecord(PlayerFlowState.serializer())
            .catchRecord

        assertCatch()
        val (first, second) = thenChain + listOf(null, null)
        assertEquals(jsonFlow, first)
        assertTrue(second is CompletedState)
        assertCatch()
    }

    @TestTemplate
    fun testExplicitResolve() {
        val (promise, resolver) = runtime.execute(
            """
           (function() {
               var resolver;
               const promise = new Promise(function(resolve, reject) { resolver = resolve });
               return [promise, resolver];
           })();
            """.trimIndent(),
        ) as List<*>

        Promise(promise as Node)
            .thenRecord
            .catchRecord

        (resolver as Invokable<*>)(42)
        assertCatch()
        assertThen(42)
    }

    @TestTemplate
    fun testNewPromiseCreationResolve() {
        runtime.Promise<Int> { resolve, _ ->
            resolve(42)
        }.thenRecord.catchRecord

        assertCatch()
        assertThen(42)
    }

    @TestTemplate
    fun testNewPromiseCreationReject() {
        runtime.Promise<Int> { _, reject ->
            reject(PlayerException("84"))
        }.thenRecord.catchRecord

        assertCatch("84")
        assertThen()
    }

    @TestTemplate
    fun testPromiseReject() {
        runtime.Promise.reject("84").thenRecord.catchRecord

        assertCatch("84")
        assertThen()
    }

    @TestTemplate
    fun testErrorStacktraceFromJVMThrowableInThen() {
        val exception = PlayerException("wow").apply {
            stackTrace = arrayOf(currentStackTrace().first())
        }

        runtime.Promise.resolve(42)
            .then<Any> { throw exception }
            .thenRecord.catchRecord

        val (caught) = catchChain
        assertTrue(caught is Throwable)
        caught as Throwable
        assertEquals(exception.message, caught.message)
        assertEquals(exception.stackTrace.normalizeStackTraceElements(), caught.stackTrace.normalizeStackTraceElements())
    }

    @TestTemplate
    fun testErrorStacktraceFromJVMThrowableWithThrow() {
        val exception = PlayerException("wow").apply {
            stackTrace = arrayOf(currentStackTrace().first())
        }

        runtime.Promise<Int> { _, _ ->
            throw exception
        }.thenRecord.catchRecord

        val (caught) = catchChain
        assertTrue(caught is Throwable)
        caught as Throwable
        caught.printStackTrace()
        assertEquals(exception.message, caught.message)
        assertEquals(exception.stackTrace.normalizeStackTraceElements(), caught.stackTrace.normalizeStackTraceElements())
    }

    @TestTemplate
    fun testErrorStacktraceFromJVMThrowableWithReject() {
        val exception = PlayerException("wow").apply {
            stackTrace = arrayOf(currentStackTrace().first())
        }

        runtime.Promise<Int> { _, reject ->
            reject(exception)
        }.thenRecord.catchRecord

        val (caught) = catchChain
        assertTrue(caught is Throwable)
        caught as Throwable
        assertEquals(exception.message, caught.message)
        assertEquals(exception.stackTrace.normalizeStackTraceElements(), caught.stackTrace.normalizeStackTraceElements())
    }

    @TestTemplate
    fun testPromiseConstructor() = runBlockingTest {
        runtime.execute(
            """
        class TestClass {
            name = 'foo';
            constructor(promise) {
                promise.then((value) => {
                    this.name = value;
                });
            };
        }""",
        )
        val promise = runtime.Promise<String> { jsRes, _ ->
            jsRes("bar")
        }
        runtime.add("myPromise", promise)
        val value = runtime.execute("new TestClass(myPromise)") as Node
        promise.toCompletable(String.serializer()).await()
        assertEquals("bar", value["name"])
    }
}
