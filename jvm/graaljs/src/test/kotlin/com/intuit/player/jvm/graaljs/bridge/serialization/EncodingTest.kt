package com.intuit.player.jvm.graaljs.bridge.serialization

import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.graaljs.base.GraalTest
import com.intuit.player.jvm.graaljs.bridge.serialization.format.encodeToGraalValue
import com.intuit.player.jvm.graaljs.extensions.blockingLock
import kotlinx.serialization.Serializable
import org.graalvm.polyglot.proxy.ProxyExecutable
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class PrimitiveEncoding : GraalTest() {

    @Test
    fun `encode string primitive`() = format.context.blockingLock {
        eval("js", "'hello'").assertEquivalent(format.encodeToGraalValue("hello"))
    }

    @Test
    fun `encode boolean primitive`() = format.context.blockingLock {
        eval("js", "true").assertEquivalent(format.encodeToGraalValue(true))
    }

    @Test
    fun `encode int primitive`() = format.context.blockingLock {
        eval("js", "20").assertEquivalent(format.encodeToGraalValue(20))
    }

    @Test
    fun `encode double primitive`() = format.context.blockingLock {
        eval("js", "2.2").assertEquivalent(format.encodeToGraalValue(2.2))
    }

    @Test
    fun `encode long primitive`() = format.context.blockingLock {
        eval("js", "20.0").assertEquivalent(format.encodeToGraalValue(20L))
    }

    @Test
    fun `encode unit`() = format.context.blockingLock {
        eval("js", "undefined").assertEquivalent(format.encodeToGraalValue(Unit))
    }

    @Test
    fun `encode null`() = format.context.blockingLock {
        eval("js", "null").assertEquivalent(format.encodeToGraalValue<Int?>(null))
    }
}

internal class StructureEncoding : GraalTest() {

    @Test
    fun `encode concretely typed flat map`() = format.context.blockingLock {
        val graalObject = eval("js", "new Object()")
        graalObject.putMember("one", 1)
        graalObject.putMember("two", 2)
        graalObject.putMember("three", 3)

        val map = mapOf(
            "one" to 1,
            "two" to 2,
            "three" to 3,
        )

        graalObject.assertEquivalent(format.encodeToGraalValue(map))
    }

    @Test
    fun `encode abstractly typed flat map`() = format.context.blockingLock {
        val graalObject = eval("js", "new Object()")
        graalObject.putMember("one", 1)
        graalObject.putMember("true", true)
        graalObject.putMember("three", "three")

        val map = mapOf(
            "one" to 1,
            "true" to true,
            "three" to "three",
        )

        graalObject.assertEquivalent(format.encodeToGraalValue(map))
    }

    @Test
    fun `encode concretely typed nested map`() = format.context.blockingLock {
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

        graalObject.assertEquivalent(format.encodeToGraalValue(map))
    }

    @Test
    fun `encode abstractly typed nested map`() = format.context.blockingLock {
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

        graalObject.assertEquivalent(format.encodeToGraalValue(map))
    }

    @Test
    fun `encode concretely typed flat list`() = format.context.blockingLock {
        val graalArray = eval("js", "[]")
        graalArray.setArrayElement(0, 1)
        graalArray.setArrayElement(1, 2)
        graalArray.setArrayElement(2, 3)

        val list = listOf(
            1,
            2,
            3,
        )

        graalArray.assertEquivalent(format.encodeToGraalValue(list))
    }

    @Test
    fun `encode abstractly typed flat list`() = format.context.blockingLock {
        val graalArray = eval("js", "[]")
        graalArray.setArrayElement(0, 1)
        graalArray.setArrayElement(1, "two")
        graalArray.setArrayElement(2, true)

        val list = listOf(
            1,
            "two",
            true,
        )

        graalArray.assertEquivalent(format.encodeToGraalValue(list))
    }

    @Test
    fun `encode concretely typed nested list`() = format.context.blockingLock {
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

        graalArray.assertEquivalent(format.encodeToGraalValue(list))
    }

    @Test
    fun `encode abstractly typed nested list`() = format.context.blockingLock {
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

        graalArray.assertEquivalent(format.encodeToGraalValue(list))
    }
}

internal class ClassEncoding : GraalTest() {

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

    @Test fun `encode serializable class with primitives`() = format.context.blockingLock {
        val graalObject = eval("js", "new Object()")
        graalObject.putMember("int", 0)
        graalObject.putMember("string", "string")
        graalObject.putMember("double", 7.7)
        graalObject.putMember("boolean", true)
        graalObject.putMember("nullable", null)

        graalObject.assertEquivalent(format.encodeToGraalValue(PrimitiveData()))
    }

    @Test fun `encode serializable class with functions and members`() = format.context.blockingLock {
        val graalObject = eval("js", "new Object()")
        graalObject.putMember("int", 0)
        graalObject.putMember("string", "string")
        graalObject.putMember("double", 7.7)
        graalObject.putMember("boolean", true)
        graalObject.putMember("nullable", null)
        graalObject.putMember(
            "function",
            ProxyExecutable { args ->
                "${args[0].asString()}: ${args[1].asInt()}"
            }
        )
        graalObject.putMember(
            "invokable",
            ProxyExecutable { args ->
                "${args[0].asString()}: ${args[1].asInt()}"
            }
        )
        graalObject.putMember("property", "hello")

        val other = format.encodeToGraalValue(PrimitiveDataAndFunctionsAndMembers())
        graalObject.assertEquivalent(other)
        Assertions.assertEquals("PLAYER: 1", other.getMember("function").execute("PLAYER", 1).asString())
        Assertions.assertEquals("PLAYER: 2", other.getMember("invokable").execute("PLAYER", 2).asString())
    }
}

internal class FunctionEncoding : GraalTest() {

    @Test fun `encode typed lambda`() = format.context.blockingLock {
        val callback = { p0: String, p1: Int -> "$p0: $p1" }

        Assertions.assertEquals("PLAYER: 1", callback("PLAYER", 1))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.encodeToGraalValue(callback).execute("PLAYER", 2).asString()
        )
    }

    @Test fun `encode invokable`() = format.context.blockingLock {
        val callback = Invokable { (p0, p1) -> "$p0: $p1" }

        Assertions.assertEquals("PLAYER: 1", callback("PLAYER", 1))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.encodeToGraalValue(callback).execute("PLAYER", 2).asString()
        )
    }

    @Test fun `encode kcallable`() = format.context.blockingLock {
        class Container {
            fun callback(p0: String, p1: Int) = "$p0: $p1"
        }

        val callback = Container()::callback

        Assertions.assertEquals("PLAYER: 1", callback("PLAYER", 1))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.encodeToGraalValue(callback).execute("PLAYER", 2).asString()
        )
    }
}
