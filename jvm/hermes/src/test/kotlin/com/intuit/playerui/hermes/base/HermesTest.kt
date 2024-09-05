package com.intuit.playerui.hermes.base

import com.facebook.soloader.nativeloader.NativeLoader
import com.intuit.playerui.bridge.loader.ResourceLoaderDelegate
import com.intuit.playerui.hermes.bridge.HermesNode
import com.intuit.playerui.hermes.bridge.runtime.Hermes
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.hermes.extensions.RuntimeThreadContext
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.format.decodeFromValue
import com.intuit.playerui.utils.test.PromiseUtils
import com.intuit.playerui.utils.test.ThreadUtils
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeAll

internal abstract class HermesTest(val runtime: HermesRuntime = Hermes.create()) : PromiseUtils, ThreadUtils {

    val format = runtime.format

    // PromiseUtils
    override val thenChain = mutableListOf<Any?>()
    override val catchChain = mutableListOf<Any?>()

    // ThreadUtils
    override val threads = mutableListOf<Thread>()
    override val exceptions = mutableListOf<Throwable>()

    fun assertEquals(a: Value, b: Value) {
        Assertions.assertEquals(format.decodeFromValue<Any?>(a), format.decodeFromValue<Any?>(b))
    }

    context(RuntimeThreadContext) fun assertEquivalent(a: Object, b: Object) {
        // verify that all missing keys from another are null or undefined
        val aKeys = HermesNode(a, runtime).keys
        val bKeys = HermesNode(b, runtime).keys

        // verify that all missing keys from b are null or undefined
        (aKeys - bKeys).forEach { missingKey ->
            val actual = a.getProperty(runtime, missingKey)
            assertTrue(actual.isNull() || actual.isUndefined())
        }

        // verify that all missing keys from a are null or undefined
        (bKeys - aKeys).forEach { missingKey ->
            val actual = b.getProperty(runtime, missingKey)
            assertTrue(actual.isNull() || actual.isUndefined())
        }

        aKeys.forEach { key ->
            val (aVal, bVal) = a.getProperty(runtime, key) to b.getProperty(runtime, key)
            if (aVal.isObject() && bVal.isObject()) {
                assertEquivalent(aVal.asObject(runtime), bVal.asObject(runtime))
            } else {
                assertEquals(aVal, bVal)
            }
        }
    }

    companion object {
        @JvmStatic @BeforeAll
        fun setupNativeLoader() {
            if (!NativeLoader.isInitialized()) NativeLoader.init(ResourceLoaderDelegate())
        }
    }
}
