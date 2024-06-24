package com.intuit.playerui.jsi

import com.facebook.jni.CppException
import com.facebook.soloader.nativeloader.NativeLoader
import com.intuit.playerui.hermes.bridge.ResourceLoaderDelegate
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime.Config
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

internal abstract class HermesRuntimeTest(val runtime: HermesRuntime = HermesRuntime()) {
    companion object {
        @JvmStatic @BeforeAll fun setupNativeLoader() {
            if (!NativeLoader.isInitialized()) NativeLoader.init(ResourceLoaderDelegate())
        }
    }
}

/// Set of tests for the JSI JNI wrappers - uses Hermes as the basis for testing against APIs that require a runtime
internal class RuntimeTest : HermesRuntimeTest() {

    @Test fun `can evaluate valid js and get the result`() {
        val result = runtime.evaluateJavaScript("2 + 2")
        assertEquals(4.0, result.asNumber())
    }

    @Test fun `can handle errors thrown from JS on the JVM`() {
        assertEquals("""hello

Error: hello
    at global (unknown:1:12)""", assertThrows<CppException> {
            runtime.evaluateJavaScript("throw Error('hello')")
        }.message)
    }

    @Test fun `can prepare js and execute later`() {
        val prepared = runtime.prepareJavaScript("() => 3")
        val result = runtime.evaluatePreparedJavaScript(prepared)
        assertEquals(3.0, result.asObject(runtime).asFunction(runtime).call(runtime).asNumber())
    }

    @Test fun `can't queue a microtask if it's disabled (by default)`() {
        assertEquals("Could not enqueue microtask because they are disabled in this runtime", assertThrows<CppException> {
            val function = runtime.evaluateJavaScript("() => {}").asObject(runtime).asFunction(runtime)
            runtime.queueMicrotask(function)
        }.message)
    }

    @Test fun `can queue and drain microtasks`() {
        val runtime = HermesRuntime(Config(microtaskQueue = true))
        val function = runtime.evaluateJavaScript("() => { a = 2 }").asObject(runtime).asFunction(runtime)
        assertTrue(runtime.global().getProperty(runtime, "a").isUndefined())
        runtime.queueMicrotask(function)
        runtime.drainMicrotasks()
        assertEquals(2.0, runtime.global().getProperty(runtime, "a").asNumber())
    }

    @Test fun `can get the description`() {
        assertEquals("HermesRuntime", runtime.description())
    }
}

internal class ValueTest : HermesRuntimeTest() {
    @Test fun y() {}
}

class ObjectTest {
    @Test fun yo() {}
}
