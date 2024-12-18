package com.intuit.playerui.hermes.bridge.runtime

import com.intuit.playerui.core.bridge.PlayerRuntimeException
import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.hermes.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.jsi.Value
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

internal class HermesRuntimeTest : HermesTest() {

    @Test fun `execute arbitrary JS`() = runtime.evaluateInJSThreadBlocking {
        assertTrue(Value.strictEquals(runtime, Value.from(runtime, 4), runtime.evaluateJavaScript("2 + 2")))
    }

    @Test fun `exception on execution after release`() {
        val runtime = HermesRuntime()
        runtime.release()

        assertEquals(
            "[HermesRuntime] Runtime object has been released!",
            assertThrows<PlayerRuntimeException> {
                runtime.execute("2 + 2")
            }.message,
        )
    }
}
