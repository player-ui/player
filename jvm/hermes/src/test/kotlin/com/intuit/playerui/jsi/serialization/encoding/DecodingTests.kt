package com.intuit.playerui.jsi.serialization.encoding

import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.format.decodeFromValue
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class PrimitiveDecodingTests : HermesTest() {

    @Test
    fun `decode string primitive`() {
        assertEquals("hello", format.decodeFromValue<String>(Value.from(runtime, "hello")))
    }

    @Test
    fun `decode boolean primitive`() {
        assertEquals(true, format.decodeFromValue<Boolean>(Value.from(true)))
    }

    @Test
    fun `decode int primitive`() {
        assertEquals(20, format.decodeFromValue(Value.from(20)))
    }

    @Test
    fun `decode double primitive`() {
        assertEquals(2.2, format.decodeFromValue(Value.from(2.2)))
    }

    @Test
    fun `decode unit`() {
        assertEquals(null, format.decodeFromValue<Boolean?>(Value.undefined()))
    }

    @Test
    fun `decode null`() {
        assertEquals(null, format.decodeFromValue<Boolean?>(Value.`null`()))
    }
}

//internal class FunctionDecodingTests : HermesRuntimeTest() {
//
//    @Test fun `decode typed lambda`() {
//        val function = Function.createFromHostFunction(runtime) { runtime, args ->
//            Value.from(runtime, "${args[0].toString(runtime)}: ${args[1].toString(runtime)}")
//        }
//
//        assertEquals("PLAYER: 1", function.call(runtime, Value.from(runtime, "PLAYER"), Value.from(1)))
//        assertEquals(
//            "PLAYER: 2",
//            format.decodeFromValue<Function2<String, Int, String>>(function.asValue())("PLAYER", 2),
//        )
//    }
//
//    @Test fun `decode invokable`() {
//        val function = Function.createFromHostFunction(runtime) { runtime, args ->
//            Value.from(runtime, "${args[0].toString(runtime)}: ${args[1].toString(runtime)}")
//        }
//
//        assertEquals("PLAYER: 1", function.call(runtime, Value.from(runtime, "PLAYER"), Value.from(1)))
//        assertEquals(
//            "PLAYER: 2",
//            format.decodeFromValue<Invokable<String>>(function.asValue())("PLAYER", 2),
//        )
//    }
//
//    @Test fun `decode kcallable`() {
//        @Serializable
//        data class Container(
//            val method: (String, Int) -> String,
//        )
//
//        val function = Function.createFromHostFunction(runtime) { runtime, args ->
//            Value.from(runtime, "${args[0].toString(runtime)}: ${args[1].toString(runtime)}")
//        }
//        val containerValue = Object(runtime).apply {
//            setProperty(runtime, "method", function.asValue())
//        }
//
//        assertEquals("PLAYER: 1", function.call(runtime, Value.from(runtime, "PLAYER"), Value.from(1)))
//        assertEquals(
//            "PLAYER: 2",
//            format.decodeFromValue<Container>(containerValue.asValue()).method("PLAYER", 2),
//        )
//    }
//}
