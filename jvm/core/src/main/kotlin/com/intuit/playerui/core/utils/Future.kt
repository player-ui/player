package com.intuit.playerui.core.utils

import kotlinx.coroutines.delay
import java.util.concurrent.Future

/**
 * Method to await on a Java Future in a coroutine context and returning the result
 */
@InternalPlayerApi
public suspend fun <T> Future<T>.await(): T {
    while (!isDone) delay(10)
    return get()
}
