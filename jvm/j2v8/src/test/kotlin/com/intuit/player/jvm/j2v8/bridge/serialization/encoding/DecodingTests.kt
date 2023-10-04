package com.intuit.player.jvm.j2v8.bridge.serialization.encoding

import com.eclipsesource.v8.V8
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.j2v8.*
import com.intuit.player.jvm.j2v8.base.J2V8Test
import com.intuit.player.jvm.j2v8.bridge.serialization.format.decodeFromV8Value
import com.intuit.player.jvm.j2v8.extensions.blockingLock
import kotlinx.serialization.Serializable
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class PrimitiveDecoding : J2V8Test() {

    @Test
    fun `decode string primitive`() = v8.blockingLock {
        assertEquals("hello", format.decodeFromV8Value<String>(V8Primitive("hello")))
    }

    @Test
    fun `decode boolean primitive`() = v8.blockingLock {
        assertEquals(true, format.decodeFromV8Value<Boolean>(V8Primitive(true)))
    }

    @Test
    fun `decode int primitive`() = v8.blockingLock {
        assertEquals(20, format.decodeFromV8Value(V8Primitive(20)))
    }

    @Test
    fun `decode double primitive`() = v8.blockingLock {
        assertEquals(2.2, format.decodeFromV8Value(V8Primitive(2.2)))
    }

    @Test
    fun `decode unit`() = v8.blockingLock {
        assertEquals(null, format.decodeFromV8Value<Boolean?>(V8.getUndefined()))
    }

    @Test
    fun `decode null`() = v8.blockingLock {
        assertEquals(null, format.decodeFromV8Value<Boolean?>(V8Null))
    }
}

internal class FunctionDecoding : J2V8Test() {

    @Test fun `decode typed lambda`() = v8.blockingLock {
        val args = V8Array {
            push("PLAYER")
            push(1)
        }
        val function = V8Function(format) {
            val p0 = it.get(0)
            val p1 = it.get(1)

            "$p0: $p1"
        }

        assertEquals("PLAYER: 1", function.call(this, args))
        assertEquals(
            "PLAYER: 2",
            format.decodeFromV8Value<Function2<String, Int, String>>(function)("PLAYER", 2)
        )
    }

    @Test fun `decode invokable`() = v8.blockingLock {
        val args = V8Array {
            push("PLAYER")
            push(1)
        }
        val function = V8Function(format) {
            val p0 = it.get(0)
            val p1 = it.get(1)

            "$p0: $p1"
        }

        assertEquals("PLAYER: 1", function.call(this, args))
        assertEquals(
            "PLAYER: 2",
            format.decodeFromV8Value<Invokable<String>>(function)("PLAYER", 2)
        )
    }

    @Test fun `decode kcallable`() = v8.blockingLock {
        @Serializable
        data class Container(
            val method: (String, Int) -> String
        )

        val args = V8Array {
            push("PLAYER")
            push(1)
        }
        val function = V8Function(format) {
            val p0 = it.get(0)
            val p1 = it.get(1)

            "$p0: $p1"
        }

        assertEquals("PLAYER: 1", function.call(this, args))
        assertEquals(
            "PLAYER: 2",
            format.decodeFromV8Value<Container>(
                V8Object {
                    add("method", function)
                }
            ).method("PLAYER", 2)
        )
    }
}
