package com.intuit.player.jvm.graaljs.bridge.serialization

import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.graaljs.base.GraalTest
import com.intuit.player.jvm.graaljs.bridge.serialization.format.decodeFromGraalValue
import com.intuit.player.jvm.graaljs.extensions.blockingLock
import kotlinx.serialization.Serializable
import org.graalvm.polyglot.proxy.ProxyExecutable
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class PrimitiveDecoding : GraalTest() {

    @Test
    fun `decode string primitive`() = format.context.blockingLock {
        Assertions.assertEquals("hello", format.decodeFromGraalValue(eval("js", "'hello'")))
    }

    @Test
    fun `decode boolean primitive`() = format.context.blockingLock {
        Assertions.assertEquals(true, format.decodeFromGraalValue<Boolean>(eval("js", "true")))
    }

    @Test
    fun `decode int primitive`() = format.context.blockingLock {
        Assertions.assertEquals(20, format.decodeFromGraalValue(eval("js", "20")))
    }

    @Test
    fun `decode double primitive`() = format.context.blockingLock {
        Assertions.assertEquals(2.2, format.decodeFromGraalValue(eval("js", "2.2")))
    }

    @Test
    fun `decode unit`() = format.context.blockingLock {
        Assertions.assertEquals(null, format.decodeFromGraalValue<Boolean?>(eval("js", "undefined")))
    }

    @Test
    fun `decode null`() = format.context.blockingLock {
        Assertions.assertEquals(null, format.decodeFromGraalValue<Boolean?>(eval("js", "null")))
    }
}

internal class StructureDecoding : GraalTest() {

    @Test
    fun `decode concretely typed flat map`() = format.context.blockingLock {
        val graalObject = eval("js", "new Object()")
        graalObject.putMember("one", 1)
        graalObject.putMember("two", 2)
        graalObject.putMember("three", 3)

        val map = mapOf(
            "one" to 1,
            "two" to 2,
            "three" to 3,
        )

        Assertions.assertEquals(map, format.decodeFromGraalValue<Map<String, Int>>(graalObject))
    }

    @Test
    fun `decode abstractly typed flat map`() = format.context.blockingLock {
        val graalObject = eval("js", "new Object()")
        graalObject.putMember("one", 1)
        graalObject.putMember("true", true)
        graalObject.putMember("three", "three")

        val map = mapOf(
            "one" to 1,
            "true" to true,
            "three" to "three",
        )

        Assertions.assertEquals(map, format.decodeFromGraalValue(graalObject))
    }

    @Test
    fun `decode concretely typed nested map`() = format.context.blockingLock {
        val graalObject = eval("js", "new Object()")
        val innerFirst = eval("js", "new Object()").also { it.putMember("two", 2) }
        val innerSecond = eval("js", "new Object()").also { it.putMember("four", 4) }
        graalObject.putMember("one", innerFirst)
        graalObject.putMember("three", innerSecond)

        val map = mapOf(
            "one" to mapOf(
                "two" to 2,
            ),
            "three" to mapOf(
                "four" to 4,
            ),
        )

        Assertions.assertEquals(map, format.decodeFromGraalValue<Map<String, Map<String, Int>>>(graalObject))
    }

    @Test
    fun `decode abstractly typed nested map`() = format.context.blockingLock {
        val graalObject = eval("js", "new Object()")
        val innerFirst = eval("js", "new Object()").also {
            it.putMember("two", 2)
            it.putMember("three", true)
        }
        val innerSecond = eval("js", "new Object()").also {
            it.putMember("five", 5)
            it.putMember("six", "six")
        }
        graalObject.putMember("one", innerFirst)
        graalObject.putMember("four", innerSecond)
        graalObject.putMember("seven", 7.7)

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

        Assertions.assertEquals(map, format.decodeFromGraalValue(graalObject))
    }

    @Test
    fun `decode concretely typed flat list`() = format.context.blockingLock {
        val graalArray = eval("js", "[]")
        graalArray.setArrayElement(0, 1)
        graalArray.setArrayElement(1, 2)
        graalArray.setArrayElement(2, 3)

        val list = listOf(
            1,
            2,
            3,
        )

        Assertions.assertEquals(list, format.decodeFromGraalValue<List<Int>>(graalArray))
    }

    @Test
    fun `decode abstractly typed flat list`() = format.context.blockingLock {
        val graalArray = eval("js", "[]")
        graalArray.setArrayElement(0, 1)
        graalArray.setArrayElement(1, "two")
        graalArray.setArrayElement(2, true)

        val list = listOf(
            1,
            "two",
            true,
        )

        Assertions.assertEquals(list, format.decodeFromGraalValue(graalArray))
    }

    @Test
    fun `decode concretely typed nested list`() = format.context.blockingLock {
        val graalArray = eval("js", "[]")
        graalArray.setArrayElement(
            0,
            eval("js", "[]").also {
                it.setArrayElement(0, 1)
                it.setArrayElement(1, 2)
            }
        )
        graalArray.setArrayElement(
            1,
            eval("js", "[]").also {
                it.setArrayElement(0, 3)
                it.setArrayElement(1, 4)
            }
        )

        val list = listOf(
            listOf(1, 2),
            listOf(3, 4),
        )

        Assertions.assertEquals(list, format.decodeFromGraalValue<List<List<Int>>>(graalArray))
    }

    @Test
    fun `decode abstractly typed nested list`() = format.context.blockingLock {
        val graalArray = eval("js", "[]")
        graalArray.setArrayElement(
            0,
            eval("js", "[]").also {
                it.setArrayElement(0, 1)
                it.setArrayElement(1, "two")
            }
        )
        graalArray.setArrayElement(
            1,
            eval("js", "[]").also {
                it.setArrayElement(0, 3)
                it.setArrayElement(1, false)
            }
        )
        graalArray.setArrayElement(2, 7.7)

        val list = listOf(
            listOf(1, "two"),
            listOf(3, false),
            7.7,
        )

        Assertions.assertEquals(list, format.decodeFromGraalValue(graalArray))
    }
}

internal class ClassDecoding : GraalTest() {

    @Serializable
    data class PrimitiveData(
        val int: Int = 0,
        val string: String = "string",
        val double: Double = 7.7,
        val boolean: Boolean = true,
        val nullable: Boolean? = null,
    )

    @Test
    fun `decode serializable class`() = format.context.blockingLock {
        val graalObject = eval("js", "new Object()")
        graalObject.putMember("int", 0)
        graalObject.putMember("string", "string")
        graalObject.putMember("double", 7.7)
        graalObject.putMember("boolean", true)
        graalObject.putMember("nullable", null)

        Assertions.assertEquals(PrimitiveData(), format.decodeFromGraalValue<PrimitiveData>(graalObject))
    }
}

internal class FunctionDecoding : GraalTest() {

    @Test fun `decode typed lambda`() = format.context.blockingLock {
        val function = ProxyExecutable {
            "${it[0].asString()}: ${it[1].asInt()}"
        }
        val graalObject = eval("js", "new Object()").also {
            it.putMember("method", function)
        }

        Assertions.assertEquals("PLAYER: 1", function.execute(eval("js", "'PLAYER'"), eval("js", "1")))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.decodeFromGraalValue<Function2<String, Int, String>>(graalObject.getMember("method"))("PLAYER", 2)
        )
    }

    @Test fun `decode invokable`() = format.context.blockingLock {
        val function = ProxyExecutable {
            "${it[0].asString()}: ${it[1].asInt()}"
        }
        val graalObject = eval("js", "new Object()").also {
            it.putMember("method", function)
        }

        Assertions.assertEquals("PLAYER: 1", function.execute(eval("js", "'PLAYER'"), eval("js", "1")))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.decodeFromGraalValue<Invokable<String>>(graalObject.getMember("method"))("PLAYER", 2)
        )
    }

    @Test fun `decode kcallable`() = format.context.blockingLock {
        @Serializable
        data class Container(
            val method: (String, Int) -> String
        )

        val function = ProxyExecutable {
            "${it[0].asString()}: ${it[1].asInt()}"
        }

        Assertions.assertEquals("PLAYER: 1", function.execute(eval("js", "'PLAYER'"), eval("js", "1")))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.decodeFromGraalValue<Container>(
                eval("js", "new Object()").also {
                    it.putMember("method", function)
                }
            ).method("PLAYER", 2)
        )
    }
}
