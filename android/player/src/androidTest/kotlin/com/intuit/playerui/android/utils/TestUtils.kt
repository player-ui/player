package com.intuit.playerui.android.utils

import com.intuit.playerui.utils.test.runBlockingTest
import kotlinx.coroutines.delay
import org.junit.Assert.assertTrue

internal fun waitForCondition(
    count: Int = 5,
    delay: Long = 500,
    conditions: () -> Boolean = { true },
) {
    var counter = 0
    while (!conditions() && counter++ < count) runBlockingTest { delay(delay) }
    assertTrue(conditions())
}
