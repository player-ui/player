package com.intuit.playerui.j2v8.bridge.serialization.encoding

import com.eclipsesource.v8.V8
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.j2v8.V8Array
import com.intuit.playerui.j2v8.V8Null
import com.intuit.playerui.j2v8.V8Primitive
import com.intuit.playerui.j2v8.base.J2V8Test
import com.intuit.playerui.j2v8.bridge.serialization.format.encodeToV8Value
import com.intuit.playerui.j2v8.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.j2v8.v8Function
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class PrimitiveEncoding : J2V8Test() {
    @Test fun `encode string primitive`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        assertEquals(V8Primitive("hello"), format.encodeToV8Value("hello"))
    }

    @Test fun `encode boolean primitive`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        assertEquals(V8Primitive(true), format.encodeToV8Value(true))
    }

    @Test fun `encode int primitive`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        assertEquals(V8Primitive(20), format.encodeToV8Value(20))
    }

    @Test fun `encode double primitive`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        assertEquals(V8Primitive(2.2), format.encodeToV8Value(2.2))
    }

    @Test fun `encode long primitive`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        assertEquals(V8Primitive(20.0), format.encodeToV8Value(20L))
    }

    @Test fun `encode unit`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        assertEquals(V8.getUndefined(), format.encodeToV8Value(Unit))
    }

    @Test fun `encode null`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        assertEquals(V8Null, format.encodeToV8Value<Int?>(null))
    }
}

internal class FunctionEncoding : J2V8Test() {
    @Test fun `encode typed lambda`() = v8.evaluateInJSThreadBlocking(runtime) {
        val callback = { p0: String, p1: Int -> "$p0: $p1" }

        assertEquals("PLAYER: 1", callback("PLAYER", 1))
        assertEquals(
            "PLAYER: 2",
            format.encodeToV8Value(callback).v8Function.call(
                this,
                V8Array {
                    push("PLAYER")
                    push(2)
                },
            ),
        )
    }

    @Test fun `encode invokable`() = v8.evaluateInJSThreadBlocking(runtime) {
        val callback = Invokable { (p0, p1) -> "$p0: $p1" }

        assertEquals("PLAYER: 1", callback("PLAYER", 1))
        assertEquals(
            "PLAYER: 2",
            format.encodeToV8Value(callback).v8Function.call(
                this,
                V8Array {
                    push("PLAYER")
                    push(2)
                },
            ),
        )
    }

    @Test fun `encode kcallable`() = v8.evaluateInJSThreadBlocking(runtime) {
        class Container {
            fun callback(p0: String, p1: Int) = "$p0: $p1"
        }

        val callback = Container()::callback

        assertEquals("PLAYER: 1", callback("PLAYER", 1))
        assertEquals(
            "PLAYER: 2",
            format.encodeToV8Value(callback).v8Function.call(
                this,
                V8Array {
                    push("PLAYER")
                    push(2)
                },
            ),
        )
    }
}
