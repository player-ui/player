package com.intuit.playerui.jsi

import com.facebook.jni.CppException
import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime.Config
import com.intuit.playerui.hermes.extensions.RuntimeThreadContext
import com.intuit.playerui.hermes.extensions.evaluateInJSThreadBlocking
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

// / Set of tests for the JSI JNI wrappers - uses Hermes as the basis for testing against APIs that require a runtime
internal class RuntimeTests : HermesTest() {

    @Test fun `evaluate valid js and get the result`() = runtime.evaluateInJSThreadBlocking {
        val result = runtime.evaluateJavaScript("2 + 2")
        assertEquals(4.0, result.asNumber())
    }

    @Test fun `handle errors thrown from JS on the JVM`() = runtime.evaluateInJSThreadBlocking {
        assertEquals(
            """hello

Error: hello
    at global (unknown:1:12)""",
            assertThrows<CppException> {
                runtime.evaluateJavaScript("throw Error('hello')")
            }.message,
        )
    }

    @Test fun `prepare js and execute later`() = runtime.evaluateInJSThreadBlocking {
        val prepared = runtime.prepareJavaScript("() => 3")
        val result = runtime.evaluatePreparedJavaScript(prepared)
        assertEquals(3.0, result.asObject(runtime).asFunction(runtime).call(runtime).asNumber())
    }

    @Test fun `can't queue a microtask if it's disabled (by default)`() = runtime.evaluateInJSThreadBlocking {
        assertEquals(
            "Could not enqueue microtask because they are disabled in this runtime",
            assertThrows<CppException> {
                val function = runtime.evaluateJavaScript("() => {}").asObject(runtime).asFunction(runtime)
                runtime.queueMicrotask(function)
            }.message,
        )
    }

    @Test fun `queue and drain microtasks`() = runtime.evaluateInJSThreadBlocking {
        val runtime = HermesRuntime(Config(microtaskQueue = true))
        val function = runtime.evaluateJavaScript("() => { a = 2 }").asObject(runtime).asFunction(runtime)
        assertTrue(runtime.global().getProperty(runtime, "a").isUndefined())
        runtime.queueMicrotask(function)
        runtime.drainMicrotasks()
        assertEquals(2.0, runtime.global().getProperty(runtime, "a").asNumber())
    }

    @Test fun `get the description`() = runtime.evaluateInJSThreadBlocking {
        assertEquals("HermesRuntime", runtime.description())
    }
}

internal class ValueTests : HermesTest() {
    @Test fun `create and detect undefined`() = runtime.evaluateInJSThreadBlocking {
        val undefined = Value.undefined
        assertTrue(undefined.isUndefined())
        assertEquals("undefined", undefined.toString(runtime))
    }

    @Test fun `create and detect null`() = runtime.evaluateInJSThreadBlocking {
        val `null` = Value.`null`
        assertTrue(`null`.isNull())
        assertEquals("null", `null`.toString(runtime))
    }

    @Test fun `create and detect boolean`() = runtime.evaluateInJSThreadBlocking {
        val boolean = Value.from(true)
        assertTrue(boolean.isBoolean())
        assertTrue(boolean.asBoolean())
    }

    @Test fun `create and detect number`() = runtime.evaluateInJSThreadBlocking {
        val int = Value.from(100)
        assertTrue(int.isNumber())
        assertEquals(100, int.asNumber().toInt())

        val double = Value.from(5.5)
        assertTrue(double.isNumber())
        assertEquals(5.5, double.asNumber())
    }

    @Test fun `create and detect string`() = runtime.evaluateInJSThreadBlocking {
        val string = Value.from(runtime, "Hello")
        assertTrue(string.isString())
        assertEquals("Hello", string.asString(runtime))
    }

    @Test fun `create and detect big int as long`() = runtime.evaluateInJSThreadBlocking {
        val bigInt = runtime.evaluateJavaScript("0n")
        assertTrue(bigInt.isBigInt())
        assertEquals(0L, bigInt.asBigInt(runtime))
    }

    @Test fun `can check if values are strictEquals`() = runtime.evaluateInJSThreadBlocking {
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

    @Test fun `create from json can accept primitives`() = runtime.evaluateInJSThreadBlocking {
        assertTrue(Value.createFromJson(runtime, JsonNull).isNull())
        assertEquals(1, Value.createFromJson(runtime, JsonPrimitive(1)).asNumber().toInt())
        assertEquals("hello", Value.createFromJson(runtime, JsonPrimitive("hello")).asString(runtime))
    }
}

internal class ObjectTests : HermesTest() {
    @Test fun `can create and detect object`() = runtime.evaluateInJSThreadBlocking {
        val value = runtime.evaluateJavaScript(
            """
            ({
                hello: 'world',
                nested: {
                    some: 'data',
                },
                multiply: (a, b) => a * b,
            })
            """.trimIndent(),
        )
        assertTrue(value.isObject())
        val `object` = value.asObject(runtime)
        assertFalse(`object`.isArray(runtime))
        assertFalse(`object`.isFunction(runtime))
        assertTrue(`object`.hasProperty(runtime, "hello"))
        assertFalse(`object`.hasProperty(runtime, "world"))
        assertEquals(3, `object`.getPropertyNames(runtime).size(runtime))
        assertEquals("world", `object`.getProperty(runtime, "hello").asString(runtime))
        assertEquals("data", `object`.getPropertyAsObject(runtime, "nested").getProperty(runtime, "some").asString(runtime))
        val multiply = `object`.getPropertyAsFunction(runtime, "multiply").asFunction(runtime)
        val result = multiply.call(runtime, Value.from(2), Value.from(3)).asNumber().toInt()
        assertEquals(6, result)
    }

    @Test fun `check if instanceOf`() = runtime.evaluateInJSThreadBlocking {
        val mapCtor = runtime.global().getPropertyAsFunction(runtime, "Map")
        val map = mapCtor.callAsConstructor(runtime).asObject(runtime)
        assertTrue(map.instanceOf(runtime, mapCtor))
        val setCtor = runtime.global().getPropertyAsFunction(runtime, "Set")
        assertFalse(map.instanceOf(runtime, setCtor))
    }

    @Test fun `set property on object`() = runtime.evaluateInJSThreadBlocking {
        val obj = runtime.evaluateJavaScript("({})").asObject(runtime)
        assertFalse(obj.hasProperty(runtime, "hello"))
        obj.setProperty(runtime, "hello", Value.from(runtime, "world"))
        assertTrue(obj.hasProperty(runtime, "hello"))
        assertEquals("world", obj.getProperty(runtime, "hello").asString(runtime))
    }
}

internal class ArrayTests : HermesTest() {
    // helper for asserting the same values within an Array constructed by arbitrary means
    context(RuntimeThreadContext) private fun Array.assertValues() {
        assertEquals(3, size(runtime))

        val first = getValueAtIndex(runtime, 0)
        assertEquals(1.0, first.asNumber())

        val second = getValueAtIndex(runtime, 1)
        assertEquals("two", second.asString(runtime))

        val third = getValueAtIndex(runtime, 2)
        assertEquals(3L, third.asBigInt(runtime))
    }

    @Test fun `can create array by evaluating JS`() = runtime.evaluateInJSThreadBlocking {
        val value = runtime.evaluateJavaScript("([1, 'two', 3n])")
        assertTrue(value.isObject())
        val `object` = value.asObject(runtime)
        assertTrue(`object`.isArray(runtime))
        val array = `object`.asArray(runtime)
        array.assertValues()
    }

    @Test fun `can create array via helper`() = runtime.evaluateInJSThreadBlocking {
        val value = Array.createWithElements(runtime, Value.from(1), Value.from(runtime, "two"), Value.from(runtime, 3L))
        value.assertValues()
    }

    @Test fun `can set values in an array`() = runtime.evaluateInJSThreadBlocking {
        val array = Array.createWithElements(runtime, Value.from(20))
        array.setValueAtIndex(runtime, 0, Value.from(40))
        assertEquals(40, array.getValueAtIndex(runtime, 0).asNumber().toInt())
    }

    @Test fun `asValue works for object subclasses`() = runtime.evaluateInJSThreadBlocking {
        Array.createWithElements(
            runtime,
            Value.from(1),
            Value.from(runtime, "two"),
            Value.from(runtime, 3L),
        ).asValue(runtime).asObject(runtime).asArray(runtime).assertValues()
    }
}

internal class FunctionTests : HermesTest() {
    @Test fun `can call a JS function`() = runtime.evaluateInJSThreadBlocking {
        val value = runtime.evaluateJavaScript("(a, b) => a * b")
        assertTrue(value.isObject())
        val `object` = value.asObject(runtime)
        assertTrue(`object`.isFunction(runtime))
        val multiply = `object`.asFunction(runtime)
        assertFalse(multiply.isHostFunction(runtime))
        assertEquals(6, multiply.call(runtime, Value.from(1), Value.from(6)).asNumber().toInt())
    }

    @Test fun `can execute a host function`() = runtime.evaluateInJSThreadBlocking {
        val hostMultiply = HostFunction { _, _, args ->
            args.filter(Value::isNumber).fold(1.0) { acc, value -> acc * value.asNumber() }.let(Value::from)
        }
        val multiply = Function.createFromHostFunction(runtime, "multiply", 2, hostMultiply)
        assertTrue(multiply.isHostFunction(runtime))
        assertEquals(6, multiply.call(runtime, Value.from(2), Value.from(3.0)).asNumber().toInt())
    }

    @Test fun `asValue works for object subclasses`() = runtime.evaluateInJSThreadBlocking {
        val multiply = Function.createFromHostFunction(format) { args ->
            args.filterIsInstance<Number>().fold(1.0) { acc, value -> acc * value.toDouble() }
        }.asValue(runtime).asObject(runtime).asFunction(runtime)
        assertTrue(multiply.isHostFunction(runtime))
        assertEquals(6, multiply.call(runtime, Value.from(2), Value.from(3.0)).asNumber().toInt())
    }
}

internal class SymbolTests : HermesTest() {
    @Test fun `can create symbols and test equality`() = runtime.evaluateInJSThreadBlocking {
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
