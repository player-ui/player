package com.intuit.player.jvm.j2v8.bridge.serialization.encoding

import com.eclipsesource.v8.V8
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.j2v8.*
import com.intuit.player.jvm.j2v8.base.AutoAcquireJ2V8Test
import com.intuit.player.jvm.j2v8.base.J2V8Test
import com.intuit.player.jvm.j2v8.bridge.serialization.format.encodeToV8Value
import com.intuit.player.jvm.j2v8.extensions.blockingLock
import kotlinx.serialization.Serializable
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
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

internal class StructureEncoding : AutoAcquireJ2V8Test() {

    @Test fun `encode concretely typed flat map`() = format.v8.blockingLock {
        val v8Object = V8Object {
            add("one", 1)
            add("two", 2)
            add("three", 3)
        }

        val map = mapOf(
            "one" to 1,
            "two" to 2,
            "three" to 3,
        )

        assertTrue(v8Object.jsEquals(format.encodeToV8Value(map)))
    }

    @Test fun `encode abstractly typed flat map`() = format.v8.blockingLock {
        val v8Object = V8Object {
            add("one", 1)
            add("true", true)
            add("three", "three")
        }

        val map = mapOf(
            "one" to 1,
            "true" to true,
            "three" to "three",
        )

        assertTrue(v8Object.jsEquals(format.encodeToV8Value(map)))
    }

    @Test fun `encode concretely typed nested map`() = format.v8.blockingLock {
        val v8Object = V8Object {
            add(
                "one",
                V8Object {
                    add("two", 2)
                }
            )
            add(
                "three",
                V8Object {
                    add("four", 4)
                }
            )
        }

        val map = mapOf(
            "one" to mapOf(
                "two" to 2,
            ),
            "three" to mapOf(
                "four" to 4,
            ),
        )

        assertTrue(v8Object.jsEquals(format.encodeToV8Value(map)))
    }

    @Test fun `encode abstractly typed nested map`() = format.v8.blockingLock {
        val v8Object = V8Object {
            add(
                "one",
                V8Object {
                    add("two", 2)
                    add("three", true)
                }
            )
            add(
                "four",
                V8Object {
                    add("five", 5)
                    add("six", "six")
                }
            )
            add("seven", 7.7)
        }

        val map = mapOf(
            "one" to mapOf(
                "two" to 2,
                "three" to true,
            ),
            "four" to mapOf(
                "five" to 5,
                "six" to "six",
            ),
            "seven" to 7.7
        )

        assertTrue(v8Object.jsEquals(format.encodeToV8Value(map)))
    }

    @Test fun `encode concretely typed flat list`() = format.v8.blockingLock {
        val v8Array = V8Array {
            push(1)
            push(2)
            push(3)
        }

        val list = listOf(
            1,
            2,
            3,
        )

        assertTrue(v8Array.jsEquals(format.encodeToV8Value(list)))
    }

    @Test fun `encode abstractly typed flat list`() = format.v8.blockingLock {
        val v8Array = V8Array {
            push(1)
            push("two")
            push(true)
        }

        val list = listOf(
            1,
            "two",
            true,
        )

        assertTrue(v8Array.jsEquals(format.encodeToV8Value(list)))
    }

    @Test fun `encode concretely typed nested list`() = format.v8.blockingLock {
        val v8Array = V8Array {
            push(
                V8Array {
                    push(1)
                    push(2)
                }
            )
            push(
                V8Array {
                    push(3)
                    push(4)
                }
            )
        }

        val list = listOf(
            listOf(1, 2),
            listOf(3, 4),
        )

        assertTrue(v8Array.jsEquals(format.encodeToV8Value(list)))
    }

    @Test fun `encode abstractly typed nested list`() = format.v8.blockingLock {
        val v8Array = V8Array {
            push(
                V8Array {
                    push(1)
                    push("two")
                }
            )
            push(
                V8Array {
                    push(3)
                    push(false)
                }
            )
            push(7.7)
        }

        val list = listOf(
            listOf(1, "two"),
            listOf(3, false),
            7.7,
        )

        assertTrue(v8Array.jsEquals(format.encodeToV8Value(list)))
    }
}

internal class ClassEncoding : J2V8Test() {

    @Serializable
    data class PrimitiveData(
        val int: Int = 0,
        val string: String = "string",
        val double: Double = 7.7,
        val boolean: Boolean = true,
        val nullable: Boolean? = null,
    )

    @Serializable
    data class PrimitiveDataAndFunctionsAndMembers(
        val int: Int = 0,
        val string: String = "string",
        val double: Double = 7.7,
        val boolean: Boolean = true,
        val nullable: Boolean? = null,
        val function: (p0: String, p1: Int) -> String = { p0, p1 -> "$p0: $p1" },
        val invokable: Invokable<String> = Invokable { (p0, p1) -> "$p0: $p1" },
    ) {
        val property: String = "hello"
    }

    @Test fun `encode serializable class with primitives`() = v8.blockingLock {
        val v8Object = V8Object {
            add("int", 0)
            add("string", "string")
            add("double", 7.7)
            add("boolean", true)
            addNull("nullable")
        }

        v8Object.assertEquivalent(format.encodeToV8Value(PrimitiveData()))
    }

    @Test fun `encode serializable class with functions and members`() = v8.blockingLock {
        val v8Object = V8Object {
            add("int", 0)
            add("string", "string")
            add("double", 7.7)
            add("boolean", true)
            addNull("nullable")
            add(
                "function",
                V8Function(format) {
                    val p0 = it.get(0)
                    val p1 = it.get(1)

                    "$p0: $p1"
                }
            )
            add(
                "invokable",
                V8Function(format) {
                    val p0 = it.get(0)
                    val p1 = it.get(1)

                    "$p0: $p1"
                }
            )
            add("property", "hello")
        }

        val other = format.encodeToV8Value(PrimitiveDataAndFunctionsAndMembers()).v8Object
        v8Object.assertEquivalent(other)
        assertEquals("PLAYER: 1", other.executeJSFunction("function", "PLAYER", 1))
        assertEquals("PLAYER: 2", other.executeJSFunction("invokable", "PLAYER", 2))
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
