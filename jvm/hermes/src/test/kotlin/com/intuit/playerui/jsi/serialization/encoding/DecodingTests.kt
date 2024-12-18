package com.intuit.playerui.jsi.serialization.encoding

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.hermes.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.jsi.Function
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.format.decodeFromValue
import kotlinx.serialization.Serializable
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class PrimitiveDecodingTests : HermesTest() {

    @Test
    fun `decode string primitive`() = runtime.evaluateInJSThreadBlocking {
        assertEquals("hello", format.decodeFromValue<String>(Value.from(runtime, "hello")))
    }

    @Test
    fun `decode boolean primitive`() = runtime.evaluateInJSThreadBlocking {
        assertEquals(true, format.decodeFromValue<Boolean>(Value.from(runtime, true)))
    }

    @Test
    fun `decode int primitive`() = runtime.evaluateInJSThreadBlocking {
        assertEquals(20, format.decodeFromValue(Value.from(runtime, 20)))
    }

    @Test
    fun `decode double primitive`() = runtime.evaluateInJSThreadBlocking {
        assertEquals(2.2, format.decodeFromValue(Value.from(runtime, 2.2)))
    }

    @Test
    fun `decode unit`() = runtime.evaluateInJSThreadBlocking {
        assertEquals(null, format.decodeFromValue<Boolean?>(Value.getUndefined(runtime)))
    }

    @Test
    fun `decode null`() = runtime.evaluateInJSThreadBlocking {
        assertEquals(null, format.decodeFromValue<Boolean?>(Value.getNull(runtime)))
    }
}

internal class FunctionDecodingTests : HermesTest() {

    @Test fun `decode typed lambda`() = runtime.evaluateInJSThreadBlocking {
        val function = Function.createFromHostFunction(runtime) { runtime, args ->
            // TODO: I'm sad that this doesn't error out -- we likely need to experiment with @DslMarker more
            Value.from(runtime, "${args[0].toString(runtime)}: ${args[1].toString(runtime)}")
        }

        assertEquals("PLAYER: 1", function.call(runtime, Value.from(runtime, "PLAYER"), Value.from(runtime, 1)).asString(runtime))
        assertEquals(
            "PLAYER: 2",
            format.decodeFromValue<Function2<String, Int, String>>(function.asValue(runtime))("PLAYER", 2),
        )
    }

    @Test fun `decode invokable`() = runtime.evaluateInJSThreadBlocking {
        val function = Function.createFromHostFunction(runtime) { runtime, args ->
            Value.from(runtime, "${args[0].toString(runtime)}: ${args[1].toString(runtime)}")
        }

        assertEquals("PLAYER: 1", function.call(runtime, Value.from(runtime, "PLAYER"), Value.from(runtime, 1)).asString(runtime))
        assertEquals(
            "PLAYER: 2",
            format.decodeFromValue<Invokable<String>>(function.asValue(runtime))("PLAYER", 2),
        )
    }

    @Test fun `decode kcallable`() = runtime.evaluateInJSThreadBlocking {
        @Serializable
        data class Container(
            val method: (String, Int) -> String,
        )

        val function = Function.createFromHostFunction(runtime) { runtime, args ->
            Value.from(runtime, "${args[0].toString(runtime)}: ${args[1].toString(runtime)}")
        }
        val containerValue = Object(runtime).apply {
            setProperty(runtime, "method", function.asValue(runtime))
        }

        assertEquals("PLAYER: 1", function.call(runtime, Value.from(runtime, "PLAYER"), Value.from(runtime, 1)).asString(runtime))
        assertEquals(
            "PLAYER: 2",
            format.decodeFromValue<Container>(containerValue.asValue(runtime)).method("PLAYER", 2),
        )
    }
}
