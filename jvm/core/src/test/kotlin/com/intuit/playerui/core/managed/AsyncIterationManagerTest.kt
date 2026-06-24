package com.intuit.playerui.core.managed

import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.CompletedState
import io.mockk.mockk
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.yield
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import kotlin.coroutines.resume

internal class AsyncIterationManagerTest {
    @Test fun `test progresses through predefined flows`(): Unit = runBlocking {
        val completedState = mockk<CompletedState>()
        val manager = AsyncIterationFlow(FlowManager("first", "second", "third"))
        assertEquals(AsyncIterationFlow.State.NotStarted, manager.state.value)
        manager.next()
        assertEquals("first", manager.state.value.item)
        manager.next(completedState)
        assertEquals("second", manager.state.value.item)
        manager.next(completedState)
        assertEquals("third", manager.state.value.item)
        manager.next(completedState)
        assertEquals(AsyncIterationFlow.State.Done, manager.state.value)
    }

    @Test fun `test handles errors`(): Unit = runBlocking {
        val manager = AsyncIterationFlow(
            object : AsyncIterator<String, Boolean, Boolean> {
                override suspend fun next(result: Boolean?): String? = throw PlayerException("expected")
            },
        )
        assertEquals(AsyncIterationFlow.State.NotStarted, manager.state.value)
        manager.next()
        assertEquals("expected", manager.state.value.error)
    }

    @Test fun `test pends until item is provided`(): Unit = runBlocking {
        class MockIterator : AsyncIterator<String, Boolean, Boolean> {
            private var readyToEmit = false

            override suspend fun next(result: Boolean?): String? {
                while (!readyToEmit) {
                    yield()
                }
                readyToEmit = false
                return "first"
            }

            fun emit() {
                readyToEmit = true
            }
        }
        val iterator = MockIterator()
        val manager = AsyncIterationFlow(iterator)
        assertEquals(AsyncIterationFlow.State.NotStarted, manager.state.value)
        val pendingJob = GlobalScope.launch {
            manager.next()
        }
        suspendCancellableCoroutine<Unit> { cont ->
            GlobalScope.launch {
                manager.state.collect {
                    if (it == AsyncIterationFlow.State.Pending) cont.resume(Unit)
                }
            }
        }
        assertEquals(AsyncIterationFlow.State.Pending, manager.state.value)
        iterator.emit()
        pendingJob.join()
        assertEquals("first", manager.state.value.item)
    }

    private val AsyncIterationFlow.State.item get() =
        (this as AsyncIterationFlow.State.Item<*>).value

    private val AsyncIterationFlow.State.error get() =
        (this as AsyncIterationFlow.State.Error).error.message

    private fun <Result : Any> AsyncIterationFlow<*, Result, *>.next(completedState: Result? = null) = runBlocking {
        next(completedState)
    }
}
