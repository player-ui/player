package com.intuit.playerui.j2v8.extensions

import com.intuit.playerui.j2v8.base.J2V8Test
import com.intuit.playerui.utils.test.runBlockingTest
import kotlinx.coroutines.withContext
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import kotlin.concurrent.thread

internal class UnlockTest : J2V8Test() {
    @Test
    fun `cannot unlock when another thread has the lock`() {
        thread { v8.locker.acquire() }.join()
        assertThrows(Error::class.java) { v8.unlock() }
    }

    @Test
    fun `unlock when no thread has the lock`() = runBlockingTest {
        withContext(runtime.dispatcher) {
            v8.unlock()
        }
        assertNull(v8.locker.thread)
    }

    @Test
    fun `unlock when current thread has the lock`() = runBlockingTest {
        withContext(runtime.dispatcher) {
            v8.unlock()
        }
        v8.locker.acquire()
        assertNotNull(v8.locker.thread)
        v8.unlock()
        assertNull(v8.locker.thread)
    }
}
