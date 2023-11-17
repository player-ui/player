package com.intuit.player.jvm.j2v8.bridge.serialization.format

import com.eclipsesource.v8.V8
import com.eclipsesource.v8.V8Object
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.j2v8.V8Function
import com.intuit.player.jvm.j2v8.base.J2V8Test
import com.intuit.player.jvm.j2v8.extensions.evaluateInJSThreadBlocking
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class J2V8FormatTest : J2V8Test() {

    @Test fun `encode simple map into V8Object with explicit serializers`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        val map = mapOf(
            "one" to 1,
            "two" to 2,
        )

        val v8Object = format.encodeToRuntimeValue(MapSerializer(String.serializer(), Int.serializer()), map) as V8Object

        assertEquals(1, v8Object.get("one"))
        assertEquals(2, v8Object.get("two"))
        assertEquals(V8.getUndefined(), v8Object.get("three"))
    }

    @Test fun `encode simple map into V8Object with implicit serializers`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        val map = mapOf(
            "one" to 1,
            "two" to 2,
        )

        val v8Object = format.encodeToV8Value(map) as V8Object

        assertEquals(1, v8Object.get("one"))
        assertEquals(2, v8Object.get("two"))
        assertEquals(V8.getUndefined(), v8Object.get("three"))
    }

    @Test fun `encode nested map into V8Object with implicit serializers`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        val map = mapOf(
            "one" to mapOf("three" to 3),
            "two" to mapOf("four" to 4),
        )

        val v8Object = format.encodeToV8Value(map) as V8Object

        assertEquals(3, v8Object.getObject("one").get("three"))
        assertEquals(4, v8Object.getObject("two").get("four"))
        assertEquals(V8.getUndefined(), v8Object.get("five"))
    }

    @Test fun `encode serializable into V8Object with implicit serializers`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        @Serializable
        data class Simple(
            val one: Int = 1,
            val two: Int = 2,
        )

        val v8Object = format.encodeToV8Value(Simple()) as V8Object

        println(v8Object.keys.toList())
        assertEquals(1, v8Object.get("one"))
        assertEquals(2, v8Object.get("two"))
        assertEquals(V8.getUndefined(), v8Object.get("three"))
    }

    @Test fun `decode V8Object into serializable with implicit serializers`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        @Serializable
        data class Simple(
            val one: Int = 1,
            val two: Int = 2,
        )

        val simple = format.decodeFromRuntimeValue(
            Simple.serializer(),
            V8Object(this).apply {
                add("one", 3)
                add("two", 4)
            },
        )

        assertEquals(3, simple.one)
        assertEquals(4, simple.two)
    }

    @Test fun `decode into Node backed serializable`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        data class Simple(override val node: Node) : NodeWrapper {
            fun increment(value: Int) = node.getInvokable<Int>("increment")!!(value)
        }

        val simple = format.decodeFromRuntimeValue(
            NodeWrapperSerializer(::Simple),
            V8Object(this).apply {
                add(
                    "increment",
                    V8Function(format) { args ->
                        args.getInteger(0) + 1
                    },
                )
            },
        )

        assertEquals(1, simple.increment(0))
    }

    @Test fun `decode function into data class`() = format.v8.evaluateInJSThreadBlocking(runtime) {
        @Serializable
        data class Data(
            val one: Int = 1,
            val increment: (Int) -> Int,
        )

        val simple = format.decodeFromRuntimeValue(
            Data.serializer(),
            V8Object(this).apply {
                add("one", 3)
                add(
                    "increment",
                    V8Function(format) { args ->
                        args.getInteger(0) + 1
                    },
                )
            },
        )

        assertEquals(3, simple.one)
        assertEquals(1, simple.increment(0))
    }
}
