package com.intuit.player.plugins.settimeout

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.Promise
import com.intuit.player.jvm.core.bridge.deserialize
import com.intuit.player.jvm.core.bridge.toCompletable
import com.intuit.player.jvm.core.player.state.errorState
import com.intuit.player.jvm.core.player.state.inProgressState
import com.intuit.player.jvm.core.plugins.Plugin
import com.intuit.player.jvm.utils.test.PlayerTest
import com.intuit.player.jvm.utils.test.RuntimeTest
import com.intuit.player.jvm.utils.test.runBlockingTest
import com.intuit.player.jvm.utils.test.simpleFlowString
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.TestTemplate

internal class SetTimeoutPluginTest : RuntimeTest() {

    @TestTemplate fun `works as intended`() = runBlockingTest {
        val exceptions = mutableListOf<Throwable>()
        Assertions.assertNull(runtime["setTimeout"])
        SetTimeoutPlugin(
            CoroutineExceptionHandler { _, exception ->
                exception.printStackTrace()
                exceptions.add(exception)
            },
        ).apply(runtime)
        Assertions.assertNotNull(runtime["setTimeout"])
        val promise = (
            runtime.execute(
                """
            (function() {
                flag = false;
                return new Promise((res) => {
                    setTimeout(() => {
                        flag = true;
                        res(flag);
                    }, 500);
                });
            }());
                """.trimIndent(),
            ) as Node
            ).deserialize<Promise>()
        Assertions.assertFalse(runtime.getBoolean("flag")!!)
        delay(1000)
        Assertions.assertTrue(promise.toCompletable<Boolean>().await()!!)
        Assertions.assertTrue(runtime.getBoolean("flag")!!)
        Assertions.assertTrue(exceptions.isEmpty())
    }

    @TestTemplate fun `JS exceptions bubble up to the exception handler`() = runBlockingTest {
        val exceptions = mutableListOf<Throwable>()
        Assertions.assertNull(runtime["setTimeout"])
        SetTimeoutPlugin(
            CoroutineExceptionHandler { _, exception ->
                exception.printStackTrace()
                exceptions.add(exception)
            },
        ).apply(runtime)
        Assertions.assertNotNull(runtime["setTimeout"])
        runtime.execute(
            """
            (function() {
                setTimeout(() => {
                    throw "err";
                }, 500);
            }());
            """.trimIndent(),
        )
        delay(1000)
        Assertions.assertEquals("err", exceptions.single().message?.takeLast(3))
    }

    @TestTemplate fun `releasing runtime doesn't cause a failure`() = runBlockingTest {
        val exceptions = mutableListOf<Throwable>()
        Assertions.assertTrue(runtime.scope.isActive)
        Assertions.assertNull(runtime["setTimeout"])
        SetTimeoutPlugin(
            CoroutineExceptionHandler { _, exception ->
                exception.printStackTrace()
                exceptions.add(exception)
            },
        ).apply(runtime)
        Assertions.assertNotNull(runtime["setTimeout"])
        runtime.execute(
            """
            (function() {
                flag = false;
                return new Promise((res) => {
                    setTimeout(() => {
                        flag = true;
                        res(flag);
                    }, 500);
                });
            }());
            """.trimIndent(),
        )
        Assertions.assertFalse(runtime.getBoolean("flag")!!)
        runtime.release()
        val job = runtime.scope.coroutineContext[Job]!!
        Assertions.assertFalse(job.isActive)
        Assertions.assertTrue(job.isCancelled)

        // failsafe to ensure that no exceptions are thrown after "some" time
        delay(1000)

        Assertions.assertTrue(job.isCompleted)
        Assertions.assertTrue(exceptions.isEmpty())
    }
}

internal class SetTimeoutPlayerPluginTest : PlayerTest() {

    override val plugins: List<Plugin> = listOf(SetTimeoutPlugin())

    @TestTemplate fun `forward errors to player`() = runBlockingTest {
        player.start(simpleFlowString)
        Assertions.assertNotNull(player.inProgressState)
        runtime.execute("""(setTimeout(() => {throw "error"}, 100))""")
        delay(500)
        Assertions.assertNotNull(player.errorState)
        Assertions.assertEquals("[SetTimeoutPlugin] Exception throw during setTimeout invocation", player.errorState?.error?.message)
    }
}
