package com.intuit.player.jvm.j2v8.base

import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach

internal abstract class AutoAcquireJ2V8Test : J2V8Test() {

    @BeforeEach
    fun acquire() {
        v8.locker.acquire()
    }

    @AfterEach
    fun release() {
        v8.locker.release()
    }
}
