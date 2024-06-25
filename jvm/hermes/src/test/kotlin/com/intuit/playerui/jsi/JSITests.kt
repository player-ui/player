package com.intuit.playerui.jsi

import com.facebook.jni.CppException
import com.facebook.soloader.nativeloader.NativeLoader
import com.intuit.playerui.hermes.bridge.ResourceLoaderDelegate
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime.Config
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
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
internal class RuntimeTests : HermesRuntimeTest() {

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

internal class ValueTests : HermesRuntimeTest() {
    @Test fun `can create and detect undefined`() {
        val undefined = Value.undefined()
        assertTrue(undefined.isUndefined())
        assertEquals("undefined", undefined.toString(runtime))
    }

    @Test fun `can create and detect null`() {
        val `null` = Value.`null`()
        assertTrue(`null`.isNull())
        assertEquals("null", `null`.toString(runtime))
    }

    @Test fun `can create and detect boolean`() {
        val boolean = Value.from(true)
        assertTrue(boolean.isBoolean())
        assertTrue(boolean.asBoolean())
    }

    @Test fun `can create and detect number`() {
        val int = Value.from(100)
        assertTrue(int.isNumber())
        assertEquals(100, int.asNumber().toInt())

        val double = Value.from(5.5)
        assertTrue(double.isNumber())
        assertEquals(5.5, double.asNumber())
    }

    @Test fun `can create and detect string`() {
        val string = Value.from(runtime, "Hello")
        assertTrue(string.isString())
        assertEquals("Hello", string.asString(runtime))
    }

    @Test fun `can create and detect big int as long`() {
        val bigInt = runtime.evaluateJavaScript("0n")
        assertTrue(bigInt.isBigInt())
        assertEquals(0L, bigInt.asBigInt(runtime))
    }

    @Test fun `can check if values are strictEquals`() {
        assertTrue(Value.strictEquals(runtime, Value.from(1), Value.from(1)))
        assertFalse(Value.strictEquals(runtime, Value.from(1), Value.from(2)))

        assertTrue(Value.strictEquals(runtime, Value.from(runtime, "hello"), Value.from(runtime, "hello")))
        assertFalse(Value.strictEquals(runtime, Value.from(runtime, "hello"), Value.from(runtime, "world")))

        val json = buildJsonObject {
            put("hello", "world")
        }
        val instance = Value.createFromJson(runtime, json)
        assertTrue(Value.strictEquals(runtime, instance, instance))
        assertFalse(Value.strictEquals(runtime, instance, Value.createFromJson(runtime, json)))
    }
}

internal class ObjectTests : HermesRuntimeTest() {
    @Test fun `can create and detect object`() {
        val value = runtime.evaluateJavaScript("""
            ({
                hello: 'world',
                nested: {
                    some: 'data',
                },
                multiply: (a, b) => a * b,
            })
        """.trimIndent())
        assertTrue(value.isObject())
        val `object` = value.asObject(runtime)
        assertFalse(`object`.isArray(runtime))
        assertFalse(`object`.isFunction(runtime))
        assertEquals(3, `object`.getPropertyNames(runtime).size(runtime))
        assertEquals("world", `object`.getProperty(runtime, "hello").asString(runtime))
        assertEquals("data", `object`.getPropertyAsObject(runtime, "nested").getProperty(runtime, "some").asString(runtime))
        val multiply = `object`.getPropertyAsFunction(runtime, "multiply").asFunction(runtime)
        val result = multiply.call(runtime, Value.from(2), Value.from(3)).asNumber().toInt()
        assertEquals(6, result)
    }
}

internal class ArrayTests : HermesRuntimeTest() {
    // helper for asserting the same values within an Array constructed by arbitrary means
    private fun Array.assertValues() {
        assertEquals(3, size(runtime))

        val first = getValueAtIndex(runtime, 0)
        assertEquals(1.0, first.asNumber())

        val second = getValueAtIndex(runtime, 1)
        assertEquals("two", second.asString(runtime))

        val third = getValueAtIndex(runtime, 2)
        assertEquals(3L, third.asBigInt(runtime))
    }

    @Test fun `can create array by evaluating JS`() {
        val value = runtime.evaluateJavaScript("([1, 'two', 3n])")
        assertTrue(value.isObject())
        val `object` = value.asObject(runtime)
        assertTrue(`object`.isArray(runtime))
        val array = `object`.asArray(runtime)
        array.assertValues()
    }

    @Test fun `can create array via helper`() {
        val value = Array.createWithElements(runtime, Value.from(1), Value.from(runtime, "two"), Value.from(runtime, 3L))
        value.assertValues()
    }
}

internal class FunctionTests : HermesRuntimeTest() {
    @Test fun `can call a JS function`() {
        val value = runtime.evaluateJavaScript("(a, b) => a * b")
        assertTrue(value.isObject())
        val `object` = value.asObject(runtime)
        assertTrue(`object`.isFunction(runtime))
        val multiply = `object`.asFunction(runtime)
        assertFalse(multiply.isHostFunction(runtime))
        assertEquals(6, multiply.call(runtime, Value.from(1), Value.from(6)).asNumber().toInt())
    }

    @Test fun `can execute a host function`() {
        val hostMultiply = HostFunction { _, _, args ->
            args.filter(Value::isNumber).fold(1.0) { acc, value -> acc * value.asNumber() }.let(Value::from)
        }
        val multiply = Function.createFromHostFunction(runtime, "multiply", 2, hostMultiply)
        assertTrue(multiply.isHostFunction(runtime))
        assertEquals(6, multiply.call(runtime, Value.from(2), Value.from(3.0)).asNumber().toInt())
    }
}

internal class SymbolTests : HermesRuntimeTest() {
    @Test fun `can create symbols and test equality`() {
        // No JSI creator for Symbols yet
        val symbol = runtime.evaluateJavaScript("Symbol.for('hello-world')")
        assertTrue(symbol.isSymbol())
        assertEquals("Symbol(hello-world)", symbol.asSymbol(runtime).toString(runtime))
        val symbol1 = runtime.evaluateJavaScript("Symbol('a')").asSymbol(runtime)
        val symbol2 = runtime.evaluateJavaScript("Symbol('a')").asSymbol(runtime)
        assertFalse(Symbol.strictEquals(runtime, symbol1, symbol2))
        assertTrue(Symbol.strictEquals(runtime, symbol.asSymbol(runtime), runtime.evaluateJavaScript("Symbol.for('hello-world')").asSymbol(runtime)))
    }
}

