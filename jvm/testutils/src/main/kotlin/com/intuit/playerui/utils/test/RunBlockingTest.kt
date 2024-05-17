package com.intuit.playerui.utils.test

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout

/**
 * Simple testing extension to ensure suspended tests have a timeout. It's important to understand that this
 * only works if coroutines are [cooperative](https://kotlinlang.org/docs/cancellation-and-timeouts.html#cancellation-is-cooperative).
 */
public fun <T> runBlockingTest(timeout: Long = 10000, block: suspend CoroutineScope.() -> T): T = runBlocking {
    withTimeout(timeout) {
        block()
    }
}
