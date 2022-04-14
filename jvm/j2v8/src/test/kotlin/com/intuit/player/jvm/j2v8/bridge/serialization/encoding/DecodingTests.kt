package com.intuit.player.jvm.j2v8.bridge.serialization.encoding

import com.eclipsesource.v8.V8
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.j2v8.*
import com.intuit.player.jvm.j2v8.base.AutoAcquireJ2V8Test
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

internal class StructureDecoding : AutoAcquireJ2V8Test() {

    @Test
    fun `decode concretely typed flat map`() = v8.blockingLock {
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

        assertEquals(map, format.decodeFromV8Value<Map<String, Int>>(v8Object))
    }

    @Test
    fun `decode abstractly typed flat map`() = v8.blockingLock {
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

        assertEquals(map, format.decodeFromV8Value(v8Object))
    }

    @Test
    fun `decode concretely typed nested map`() = v8.blockingLock {
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

        assertEquals(map, format.decodeFromV8Value<Map<String, Map<String, Int>>>(v8Object))
    }

    @Test
    fun `decode abstractly typed nested map`() = v8.blockingLock {
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

        assertEquals(map, format.decodeFromV8Value(v8Object))
    }

    @Test
    fun `decode concretely typed flat list`() = v8.blockingLock {
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

        assertEquals(list, format.decodeFromV8Value<List<Int>>(v8Array))
    }

    @Test
    fun `decode abstractly typed flat list`() = v8.blockingLock {
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

        assertEquals(list, format.decodeFromV8Value(v8Array))
    }

    @Test
    fun `decode concretely typed nested list`() = v8.blockingLock {
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

        assertEquals(list, format.decodeFromV8Value<List<List<Int>>>(v8Array))
    }

    @Test
    fun `decode abstractly typed nested list`() = v8.blockingLock {
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

        assertEquals(list, format.decodeFromV8Value(v8Array))
    }
}

internal class ClassDecoding : J2V8Test() {

    @Serializable
    data class PrimitiveData(
        val int: Int = 0,
        val string: String = "string",
        val double: Double = 7.7,
        val boolean: Boolean = true,
        val nullable: Boolean? = null,
    )

    @Test
    fun `decode serializable class`() = v8.blockingLock {
        val v8Object = V8Object {
            add("int", 0)
            add("string", "string")
            add("double", 7.7)
            add("boolean", true)
            addNull("nullable")
        }

        assertEquals(PrimitiveData(), format.decodeFromV8Value<PrimitiveData>(v8Object))
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
