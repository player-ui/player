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
        val manager = FlowManager(AsyncFlowIterator("first", "second", "third"))
        assertEquals(AsyncIterationManager.State.NotStarted, manager.state.value)
        manager.next()
        assertEquals("first", manager.state.value.item)
        manager.next(completedState)
        assertEquals("second", manager.state.value.item)
        manager.next(completedState)
        assertEquals("third", manager.state.value.item)
        manager.next(completedState)
        assertEquals(AsyncIterationManager.State.Done, manager.state.value)
    }

    @Test fun `test handles errors`(): Unit = runBlocking {
        val manager = AsyncIterationManager(
            object : AsyncIterator<String, Boolean> {
                override suspend fun next(result: Boolean?): String? {
                    throw PlayerException("expected")
                }
            },
        )
        assertEquals(AsyncIterationManager.State.NotStarted, manager.state.value)
        manager.next()
        assertEquals("expected", manager.state.value.error)
    }

    @Test fun `test pends until item is provided`(): Unit = runBlocking {
        class MockIterator : AsyncIterator<String, Boolean> {
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
        val manager = AsyncIterationManager(iterator)
        assertEquals(AsyncIterationManager.State.NotStarted, manager.state.value)
        val pendingJob = GlobalScope.launch {
            manager.next()
        }
        suspendCancellableCoroutine<Unit> { cont ->
            GlobalScope.launch {
                manager.state.collect {
                    if (it == AsyncIterationManager.State.Pending) cont.resume(Unit)
                }
            }
        }
        assertEquals(AsyncIterationManager.State.Pending, manager.state.value)
        iterator.emit()
        pendingJob.join()
        assertEquals("first", manager.state.value.item)
    }

    private val AsyncIterationManager.State.item get() =
        (this as AsyncIterationManager.State.Item<*>).value

    private val AsyncIterationManager.State.error get() =
        (this as AsyncIterationManager.State.Error).error.message

    private fun <Result : Any> AsyncIterationManager<*, Result>.next(completedState: Result? = null) = runBlocking {
        next(completedState)
    }
}
