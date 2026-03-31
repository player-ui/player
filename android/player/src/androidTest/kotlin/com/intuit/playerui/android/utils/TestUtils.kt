package com.intuit.playerui.android.utils

import android.os.Looper
import org.robolectric.Shadows.shadowOf


internal fun waitForCondition(
    count: Int = 10,
    condition: () -> Boolean,
) {
    var counter = 0
    while (!condition() && counter++ < count) {
        shadowOf(Looper.getMainLooper()).idle()
        Thread.sleep(50)
    }
}