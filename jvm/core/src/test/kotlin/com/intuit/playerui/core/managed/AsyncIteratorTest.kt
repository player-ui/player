package com.intuit.playerui.core.managed

import com.intuit.playerui.core.player.state.CompletedState
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class AsyncIteratorTest {
    @Test fun `iterator progresses through predefined items`() = runBlocking {
        val items = arrayOf("first", "second", "third")
        val iterator = AsyncIterator<String, Boolean>(*items)
        assertEquals("first", iterator.next(true))
        assertEquals("second", iterator.next(true))
        assertEquals("third", iterator.next(true))
        assertEquals(null, iterator.next(true))

        // test it doesn't crash
        iterator.terminate()
    }

    @Test fun `iterator restarts with null result`() = runBlocking {
        val items = listOf("first", "second", "third")
        val iterator = AsyncIterator<String, Boolean>(items)
        assertEquals("first", iterator.next())
        assertEquals("second", iterator.next(true))
        assertEquals("third", iterator.next(true))
        assertEquals(null, iterator.next(true))
        assertEquals("first", iterator.next())
        assertEquals("second", iterator.next(true))
        assertEquals("first", iterator.next())

        // test it doesn't crash
        iterator.terminate()
    }

    @Test fun `test predefined flows iterator`() = runBlocking {
        val completedState = mockk<CompletedState>()

        val flows = arrayOf("first", "second", "third")
        val iterator = AsyncFlowIterator(*flows)
        assertEquals("first", iterator.next())
        assertEquals("second", iterator.next(completedState))
        assertEquals("third", iterator.next(completedState))
        assertEquals(null, iterator.next(completedState))
        assertEquals("first", iterator.next())
        assertEquals("second", iterator.next(completedState))
        assertEquals("first", iterator.next())

        // test it doesn't crash
        iterator.terminate()
    }
}
