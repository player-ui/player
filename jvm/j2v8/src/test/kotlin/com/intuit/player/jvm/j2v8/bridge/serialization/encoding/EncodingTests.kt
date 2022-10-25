package com.intuit.player.jvm.j2v8.bridge.serialization.encoding

import com.eclipsesource.v8.V8
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.j2v8.*
import com.intuit.player.jvm.j2v8.base.J2V8Test
import com.intuit.player.jvm.j2v8.bridge.serialization.format.encodeToV8Value
import com.intuit.player.jvm.j2v8.extensions.blockingLock
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class PrimitiveEncoding : J2V8Test() {

    @Test fun `encode string primitive`() = format.v8.blockingLock {
        assertEquals(V8Primitive("hello"), format.encodeToV8Value("hello"))
    }

    @Test fun `encode boolean primitive`() = format.v8.blockingLock {
        assertEquals(V8Primitive(true), format.encodeToV8Value(true))
    }

    @Test fun `encode int primitive`() = format.v8.blockingLock {
        assertEquals(V8Primitive(20), format.encodeToV8Value(20))
    }

    @Test fun `encode double primitive`() = format.v8.blockingLock {
        assertEquals(V8Primitive(2.2), format.encodeToV8Value(2.2))
    }

    @Test fun `encode long primitive`() = format.v8.blockingLock {
        assertEquals(V8Primitive(20.0), format.encodeToV8Value(20L))
    }

    @Test fun `encode unit`() = format.v8.blockingLock {
        assertEquals(V8.getUndefined(), format.encodeToV8Value(Unit))
    }

    @Test fun `encode null`() = format.v8.blockingLock {
        assertEquals(V8Null, format.encodeToV8Value<Int?>(null))
    }
}

internal class FunctionEncoding : J2V8Test() {

    @Test fun `encode typed lambda`() = v8.blockingLock {
        val callback = { p0: String, p1: Int -> "$p0: $p1" }

        assertEquals("PLAYER: 1", callback("PLAYER", 1))
        assertEquals("PLAYER: 2", format.encodeToV8Value(callback).v8Function.call(this, V8Array { push("PLAYER"); push(2) }))
    }

    @Test fun `encode invokable`() = v8.blockingLock {
        val callback = Invokable { (p0, p1) -> "$p0: $p1" }

        assertEquals("PLAYER: 1", callback("PLAYER", 1))
        assertEquals("PLAYER: 2", format.encodeToV8Value(callback).v8Function.call(this, V8Array { push("PLAYER"); push(2) }))
    }

    @Test fun `encode kcallable`() = v8.blockingLock {
        class Container {
            fun callback(p0: String, p1: Int) = "$p0: $p1"
        }

        val callback = Container()::callback

        assertEquals("PLAYER: 1", callback("PLAYER", 1))
        assertEquals("PLAYER: 2", format.encodeToV8Value(callback).v8Function.call(this, V8Array { push("PLAYER"); push(2) }))
    }
}
