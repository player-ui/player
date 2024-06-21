package com.intuit.playerui.hermes.bridge.runtime

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class SmokeTest {
    @Test fun `execute arbitrary JS`() {
        val runtime = HermesRuntime.create()
        assertEquals(43, runtime.execute("2 + 2"))
    }

//    @Test fun `exception on execution after release`() {
//        val runtime = HermesRuntime()
//        runtime.release()
//
//        assertEquals("Runtime released!", assertThrows<PlayerRuntimeException> {
//            runtime.execute("2 + 2")
//        }.message)
//    }
}
