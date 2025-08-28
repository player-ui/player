package com.intuit.playerui.core.bridge.global

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.deserialize
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.utils.test.RuntimeTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.TestTemplate

@kotlinx.serialization.Serializable
data class Key(
    val a: Int,
)

@kotlinx.serialization.Serializable
data class Value(
    val b: Int,
)

internal class JSMapTest : RuntimeTest() {
    @TestTemplate
    fun `like real use case`() {
        val node = runtime.execute(
            """
            (function() {
                const map = new Map();
                map.set({'a': 1}, { 'b': 2 });
                
                return { generateMap: () => map };
            })()
            """.trimIndent(),
        ) as Node

        val map: JSMap<Key, Value> = node.getInvokable<Node>("generateMap")!!().deserialize()
        assertEquals(1, map.size)
        assertEquals(setOf(Key(1)), map.keys)
        assertEquals(listOf(Value(2)), map.values)
        assertEquals(Value(2), map[Key(1)])

        println(map.entries)
    }

    @TestTemplate
    fun `JS map with primitives are decoded properly`() {
        val node = runtime.execute(
            """
            (function() {
                const map = new Map();
                map.set('hello', 1);
                
                return { generateMap: () => map };
            })()
            """.trimIndent(),
        ) as Node

        val map: JSMap<String, Int> = node.getInvokable<Node>("generateMap")!!().deserialize()
        assertEquals(1, map.size)
        assertEquals(setOf("hello"), map.keys)
        assertEquals(listOf(1), map.values)
        assertEquals(1, map["hello"])

        println(map.entries)
    }
}
