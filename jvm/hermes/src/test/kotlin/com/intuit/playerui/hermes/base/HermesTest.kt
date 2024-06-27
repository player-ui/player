package com.intuit.playerui.hermes.base

import com.facebook.soloader.nativeloader.NativeLoader
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.jni.ResourceLoaderDelegate
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.utils.test.PromiseUtils
import com.intuit.playerui.utils.test.ThreadUtils
import org.junit.jupiter.api.BeforeAll

internal abstract class HermesTest(val runtime: HermesRuntime = HermesRuntime()) : PromiseUtils, ThreadUtils {

    val format = runtime.format

    // PromiseUtils
    override val thenChain = mutableListOf<Any?>()
    override val catchChain = mutableListOf<Any?>()

    // ThreadUtils
    override val threads = mutableListOf<Thread>()
    override val exceptions = mutableListOf<Throwable>()

    fun assertEquals(a: Value, b: Value) = runtime.areEquals(a, b)

    companion object {
        @JvmStatic @BeforeAll
        fun setupNativeLoader() {
            if (!NativeLoader.isInitialized()) NativeLoader.init(ResourceLoaderDelegate())
        }
    }
}