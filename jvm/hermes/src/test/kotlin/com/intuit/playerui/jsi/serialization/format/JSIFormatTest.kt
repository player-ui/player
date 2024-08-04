package com.intuit.playerui.jsi.serialization.format

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.hermes.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.jsi.Function
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Value
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class JSIFormatTest : HermesTest() {

    @Test fun `encode simple map into Value with explicit serializers`() = runtime.evaluateInJSThreadBlocking {
        val map = mapOf(
            "one" to 1,
            "two" to 2,
        )

        val value = format.encodeToRuntimeValue(MapSerializer(String.serializer(), Int.serializer()), map).asObject(runtime)

        assertEquals(Value.from(1), value.getProperty(runtime, "one"))
        assertEquals(Value.from(2), value.getProperty(runtime, "two"))
        assertEquals(Value.undefined, value.getProperty(runtime, "three"))
    }

    @Test fun `encode simple map into Value with implicit serializers`() = runtime.evaluateInJSThreadBlocking {
        val map = mapOf(
            "one" to 1,
            "two" to 2,
        )

        val value = format.encodeToValue(map).asObject(runtime)

        assertEquals(Value.from(1), value.getProperty(runtime, "one"))
        assertEquals(Value.from(2), value.getProperty(runtime, "two"))
        assertEquals(Value.undefined, value.getProperty(runtime, "three"))
    }

    @Test fun `encode nested map into Value with implicit serializers`() = runtime.evaluateInJSThreadBlocking {
        val map = mapOf(
            "one" to mapOf("three" to 3),
            "two" to mapOf("four" to 4),
        )

        val value = format.encodeToValue(map).asObject(runtime)

        assertEquals(Value.from(3), value.getPropertyAsObject(runtime, "one").getProperty(runtime, "three"))
        assertEquals(Value.from(4), value.getPropertyAsObject(runtime, "two").getProperty(runtime, "four"))
        assertEquals(Value.undefined, value.getProperty(runtime, "five"))
    }

    @Test fun `encode serializable into Value with implicit serializers`() = runtime.evaluateInJSThreadBlocking {
        @Serializable
        data class Simple(
            val one: Int = 1,
            val two: Int = 2,
        )

        val value = format.encodeToValue(Simple()).asObject(runtime)

        assertEquals(Value.from(1), value.getProperty(runtime, "one"))
        assertEquals(Value.from(2), value.getProperty(runtime, "two"))
        assertEquals(Value.undefined, value.getProperty(runtime, "three"))
    }

    @Test fun `decode Value into serializable with implicit serializers`() = runtime.evaluateInJSThreadBlocking {
        @Serializable
        data class Simple(
            val one: Int = 1,
            val two: Int = 2,
        )

        val simple = format.decodeFromRuntimeValue(
            Simple.serializer(),
            Object.create(runtime).apply {
                setProperty(runtime, "one", Value.from(3))
                setProperty(runtime, "two", Value.from(4))
            }.asValue(runtime),
        )

        assertEquals(3, simple.one)
        assertEquals(4, simple.two)
    }

    @Test fun `decode into Node backed serializable`() = runtime.evaluateInJSThreadBlocking {
        data class Simple(override val node: Node) : NodeWrapper {
            fun increment(value: Int) = node.getInvokable<Int>("increment")!!(value)
        }

        val simple = format.decodeFromRuntimeValue(
            NodeWrapperSerializer(::Simple),
            Object.create(runtime).apply {
                setProperty(
                    runtime,
                    "increment",
                    Function.createFromHostFunction(runtime) { args ->
                        Value.from(args[0].asNumber() + 1)
                    }.asValue(runtime),
                )
            }.asValue(runtime),
        )

        assertEquals(1, simple.increment(0))
    }

    @Test fun `decode function into data class`() = runtime.evaluateInJSThreadBlocking {
        @Serializable
        data class Data(
            val one: Int = 1,
            val increment: (Int) -> Int,
        )

        val simple = format.decodeFromRuntimeValue(
            Data.serializer(),
            Object.create(runtime).apply {
                setProperty(runtime, "one", Value.from(3))
                setProperty(
                    runtime,
                    "increment",
                    Function.createFromHostFunction(runtime) { args ->
                        Value.from(args[0].asNumber() + 1)
                    }.asValue(runtime),
                )
            }.asValue(runtime),
        )

        assertEquals(3, simple.one)
        assertEquals(1, simple.increment(0))
    }
}
