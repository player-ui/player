package com.intuit.playerui.jsi.serialization.encoding

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.format.encodeToValue
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class PrimitiveEncodingTests : HermesTest() {

    @Test fun `encode string primitive`() {
        assertEquals(Value.from(runtime, "hello"), format.encodeToValue("hello"))
    }

    @Test fun `encode boolean primitive`() {
        assertEquals(Value.from(true), format.encodeToValue(true))
    }

    @Test fun `encode int primitive`() {
        assertEquals(Value.from(20), format.encodeToValue(20))
    }

    @Test fun `encode double primitive`() {
        assertEquals(Value.from(2.2), format.encodeToValue(2.2))
    }

    @Test fun `encode long primitive`() {
        assertEquals(Value.from(runtime, 20L), format.encodeToValue(20L))
    }

    @Test fun `encode unit`() {
        assertEquals(Value.undefined(), format.encodeToValue(Unit))
    }

    @Test fun `encode null`() {
        assertEquals(Value.`null`(), format.encodeToValue<Int?>(null))
    }
}

internal class FunctionEncodingTests : HermesTest() {

    @Test fun `encode typed lambda`() {
        val callback = { p0: String, p1: Int -> "$p0: $p1" }
        val function = format.encodeToValue(callback).asObject(runtime).asFunction(runtime)

        assertEquals("PLAYER: 1", callback("PLAYER", 1))
        assertEquals("PLAYER: 2", function.call(runtime, Value.from(runtime, "PLAYER"), Value.from(2)).asString(runtime))
    }

    @Test fun `encode invokable`() {
        val callback = Invokable { (p0, p1) -> "$p0: $p1" }
        val function = format.encodeToValue(callback).asObject(runtime).asFunction(runtime)

        assertEquals("PLAYER: 1", callback("PLAYER", 1))
        assertEquals("PLAYER: 2.0", function.call(runtime, Value.from(runtime, "PLAYER"), Value.from(2)).asString(runtime))
    }

    @Test fun `encode kcallable`() {
        class Container {
            fun callback(p0: String, p1: Int) = "$p0: $p1"
        }

        val callback = Container()::callback
        val function = format.encodeToValue(callback).asObject(runtime).asFunction(runtime)

        assertEquals("PLAYER: 1", callback("PLAYER", 1))
        assertEquals("PLAYER: 2", function.call(runtime, Value.from(runtime, "PLAYER"), Value.from(2)).asString(runtime))
    }
}
