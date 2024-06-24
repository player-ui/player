package com.intuit.playerui.hermes.bridge.runtime

import com.facebook.soloader.nativeloader.NativeLoader
import com.intuit.playerui.hermes.bridge.ResourceLoaderDelegate
import com.intuit.playerui.jsi.Value
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test

internal class HermesRuntimeTest {

    @Test fun `execute arbitrary JS`() {
        val runtime = HermesRuntime()
        assertTrue(Value.strictEquals(runtime, Value.from(4), runtime.evaluateJavaScript("2 + 2")))
    }

//    @Test fun `exception on execution after release`() {
//        val runtime = HermesRuntime()
//        runtime.release()
//
//        assertEquals("Runtime released!", assertThrows<PlayerRuntimeException> {
//            runtime.execute("2 + 2")
//        }.message)
//    }

    companion object {
        @JvmStatic @BeforeAll fun setupNativeLoader(): Unit {
            NativeLoader.init(ResourceLoaderDelegate())
        }
    }
}
