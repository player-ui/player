package com.intuit.playerui.graaljs.bridge.format

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.graaljs.base.GraalTest
import com.intuit.playerui.graaljs.bridge.serialization.format.encodeToGraalValue
import com.intuit.playerui.graaljs.extensions.blockingLock
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import org.graalvm.polyglot.proxy.ProxyExecutable
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class GraalFormatTest : GraalTest() {

    @Test
    fun `encode simple map into Value with explicit serializers`() = format.context.blockingLock {
        val map = mapOf(
            "one" to 1,
            "two" to 2,
        )

        val graalObject = format.encodeToRuntimeValue(MapSerializer(String.serializer(), Int.serializer()), map)

        Assertions.assertEquals(1, graalObject.getMember("one").asInt())
        Assertions.assertEquals(2, graalObject.getMember("two").asInt())
        Assertions.assertEquals(null, graalObject.getMember("three"))
    }

    @Test
    fun `encode simple map into Value with implicit serializers`() = format.context.blockingLock {
        val map = mapOf(
            "one" to 1,
            "two" to 2,
        )

        val graalObject = format.encodeToGraalValue(map)

        Assertions.assertEquals(1, graalObject.getMember("one").asInt())
        Assertions.assertEquals(2, graalObject.getMember("two").asInt())
        Assertions.assertEquals(null, graalObject.getMember("three"))
    }

    @Test
    fun `encode nested map into Value with implicit serializers`() = format.context.blockingLock {
        val map = mapOf(
            "one" to mapOf("three" to 3),
            "two" to mapOf("four" to 4),
        )

        val graalObject = format.encodeToGraalValue(map)

        Assertions.assertEquals(3, graalObject.getMember("one").getMember("three").asInt())
        Assertions.assertEquals(4, graalObject.getMember("two").getMember("four").asInt())
        Assertions.assertEquals(null, graalObject.getMember("five"))
    }

    @Test
    fun `encode serializable into Value with implicit serializers`() = format.context.blockingLock {
        @Serializable
        data class Simple(
            val one: Int = 1,
            val two: Int = 2,
        )

        val graalObject = format.encodeToGraalValue(Simple())

        Assertions.assertEquals(1, graalObject.getMember("one").asInt())
        Assertions.assertEquals(2, graalObject.getMember("two").asInt())
        Assertions.assertEquals(null, graalObject.getMember("three"))
    }

    @Test
    fun `decode Value into serializable with explicit serializers`() = format.context.blockingLock {
        @Serializable
        data class Simple(
            val one: Int,
            val two: Int,
        )

        val graalObject = format.context.eval("js", "new Object()")
        graalObject.putMember("one", 3)
        graalObject.putMember("two", 4)

        val simple = format.decodeFromRuntimeValue(
            Simple.serializer(),
            graalObject,
        )

        Assertions.assertEquals(3, simple.one)
        Assertions.assertEquals(4, simple.two)
    }

    @Test
    fun `decode into Node backed serializable`() = format.context.blockingLock {
        data class Simple(override val node: Node) : NodeWrapper {
            fun increment(value: Int) = node.getInvokable<Int>("increment")!!(value)
        }

        val graalObject = format.context.eval("js", "new Object()")
        graalObject.putMember(
            "increment",
            ProxyExecutable { args ->
                args[0].asInt() + 1
            },
        )

        val simple = format.decodeFromRuntimeValue(
            NodeWrapperSerializer(::Simple),
            graalObject,
        )

        Assertions.assertEquals(1, simple.increment(0))
    }

    @Test
    fun `decode function into data class`() = format.context.blockingLock {
        @Serializable
        data class Data(
            val one: Int,
            val increment: (Int) -> Int,
        )

        val graalObject = format.context.eval("js", "new Object()")
        graalObject.putMember("one", 3)
        graalObject.putMember(
            "increment",
            ProxyExecutable { args ->
                args[0].asInt() + 1
            },
        )

        val simple = format.decodeFromRuntimeValue(
            Data.serializer(),
            graalObject,
        )

        Assertions.assertEquals(3, simple.one)
        Assertions.assertEquals(1, simple.increment(0))
    }
}
