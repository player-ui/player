package com.intuit.playerui.core.bridge.runtime

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.Promise
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.toCompletable
import com.intuit.playerui.utils.test.RuntimeTest
import com.intuit.playerui.utils.test.runBlockingTest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.assertThrows
import java.util.*
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume

internal class RuntimeBlockingTest : RuntimeTest() {

    private lateinit var handles: HashMap<String, Continuation<Unit>>
    private lateinit var jobs: HashMap<String, Deferred<Unit>>
    private val blockOnJvm by NodeSerializableField<(key: String) -> Unit>(::runtime)
    private val promiseOnJvm by NodeSerializableField<(key: String) -> Node>(::runtime)

    private suspend fun Deferred<Unit>.assertHandled(handle: Continuation<Unit>) {
        handle.resume(Unit)
        await()
        Assertions.assertTrue(isCompleted)
    }

    private fun CoroutineScope.doOnJvmAsync(key: String, block: suspend Deferred<Unit>.(Continuation<Unit>) -> Unit, job: suspend () -> Unit): Pair<Deferred<Unit>, Deferred<Continuation<Unit>>> = async { job() }.also { jobs[key] = it } to async {
        while (handles[key] == null) delay(50)
        (handles[key] ?: error("handle shouldn't be null"))
            .also { (jobs[key] ?: error("job shouldn't be null")).block(it) }
    }

    private fun CoroutineScope.blockOnJvmAsync(key: String = UUID.randomUUID().toString(), block: suspend Deferred<Unit>.(Continuation<Unit>) -> Unit = {}): Pair<Deferred<Unit>, Deferred<Continuation<Unit>>> =
        doOnJvmAsync(key, block) { blockOnJvm(key) }

    private fun CoroutineScope.promiseOnJvmAsync(key: String = UUID.randomUUID().toString(), block: suspend Deferred<Unit>.(Continuation<Unit>) -> Unit = {}): Pair<Deferred<Unit>, Deferred<Continuation<Unit>>> =
        doOnJvmAsync(key, block) { promiseOnJvm(key).let(::Promise).toCompletable<Unit>().await() ?: Unit }

    private suspend fun suspendOnHandler(key: String) = suspendCancellableCoroutine<Unit> { continuation ->
        synchronized(handles) {
            handles[key] = continuation
        }
    }

    @BeforeEach fun setup() {
        handles = hashMapOf()
        jobs = hashMapOf()
        runtime.add("blockOnJvm") { key: String -> runBlocking { suspendOnHandler(key) } }
        runtime.add("promiseOnJvm") { key: String ->
            runtime.Promise<Unit> { resolve, _ ->
                suspendOnHandler(key)
                resolve(Unit)
            }
        }
    }

    @TestTemplate fun `block during JS execution`() = runBlockingTest {
        val (job, handle) = blockOnJvmAsync { assertHandled(it) }
        awaitAll(job, handle)
    }

    @TestTemplate fun `suspend during JS execution`() = runBlockingTest {
        val (job, handle) = promiseOnJvmAsync { assertHandled(it) }
        awaitAll(job, handle)
        Unit
    }

    @TestTemplate fun `multiple blocks during JS execution`() = runBlockingTest {
        suspend fun waitForAllJobsToSuspend(num: Int) {
            while (jobs.size < num) delay(50)
        }

        val (job1, handle1) = blockOnJvmAsync {
            waitForAllJobsToSuspend(2)
            assertHandled(it)
        }
        val (job2, handle2) = blockOnJvmAsync {
            waitForAllJobsToSuspend(2)
            assertHandled(it)
        }

        awaitAll(handle1, handle2, job1, job2)
        Unit
    }

    @TestTemplate fun `multiple suspends during JS execution`() = runBlockingTest {
        suspend fun waitForAllJobsToSuspend(num: Int) {
            while (jobs.size < num) delay(50)
        }

        val (job1, handle1) = promiseOnJvmAsync {
            waitForAllJobsToSuspend(2)
            assertHandled(it)
        }
        val (job2, handle2) = promiseOnJvmAsync {
            waitForAllJobsToSuspend(2)
            assertHandled(it)
        }

        awaitAll(handle1, handle2, job1, job2)
        Unit
    }

    @TestTemplate fun `blocking during JS execution handled gracefully when releasing`() = runBlockingTest {
        // This behavior is not currently supported in Graal
        if (runtime.toString() == "Graal") return@runBlockingTest

        val (job, handle) = blockOnJvmAsync()
        handle.await()

        val releaseJob = async {
            runtime.release()
        }

        // ensure release is invoked before we assert on the job
        delay(500)

        job.assertHandled(handle.getCompleted())

        releaseJob.await()
    }

    @TestTemplate fun `suspending during JS execution handled gracefully when releasing`() {
        assertThrows<TimeoutCancellationException> {
            runBlockingTest {
                val (job, handle) = promiseOnJvmAsync()
                handle.await()

                // ensure completable is awaited on before we release the runtime
                delay(500)

                runtime.release()

                // this'll never complete b/c the promise will never resolve
                job.assertHandled(handle.getCompleted())
            }
        }
    }
}
