package com.intuit.player.jvm.j2v8.bridge

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.getJson
import com.intuit.player.jvm.core.bridge.toJson
import com.intuit.player.jvm.core.flow.Flow
import com.intuit.player.jvm.j2v8.base.J2V8Test
import com.intuit.player.jvm.j2v8.bridge.serialization.format.v8Object
import com.intuit.player.jvm.j2v8.extensions.blockingLock
import com.intuit.player.jvm.j2v8.extensions.handleValue
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import kotlin.concurrent.thread

/** Each method should test correct get, incorrect type, and key not found */
internal class V8NodeTest : J2V8Test() {

    @Test
    fun get() = v8.blockingLock {
        val node = buildNodeFromMap(
            "string" to "thisisastring",
            "int" to 1,
            "object" to mapOf(
                "string" to "anotherstring"
            ),
            "list" to listOf(
                1,
                "two",
                mapOf(
                    "string" to "onemorestring"
                ),
                null
            ),
            "function" to Invokable { "classicstring" },
            "null" to null
        )

        assertEquals("thisisastring", node["string"])
        assertEquals(1, node["int"])
        assertEquals("anotherstring", (node["object"] as V8Node)["string"])
        assertEquals(1, (node["list"] as List<*>)[0])
        assertEquals("two", (node["list"] as List<*>)[1])
        assertEquals("onemorestring", ((node["list"] as List<*>)[2] as V8Node)["string"])
        assertEquals(null, (node["list"] as List<*>)[3])
        assertEquals("classicstring", (node["function"] as Invokable<*>)())
        assertEquals(null, node["null"])
    }

    @Test
    fun getString() {
        val node = buildNodeFromMap(
            "string" to "string",
            "notastring" to 1
        )

        assertEquals("string", node.getString("string"))
        assertNull(node.getString("notastring"))
        assertNull(node.getString("notthere"))
    }

    @Test
    fun getFunction() = v8.blockingLock {
        val node = buildNodeFromMap(
            "function" to Invokable { "classicstring" },
            "tuple" to Invokable { (p0, p1) -> listOf(p0, p1) },
            "notafunction" to 1
        )

        assertEquals("classicstring", node.getFunction<String>("function")?.invoke())
        assertEquals(listOf("1", 2), node.getFunction<Any?>("tuple")?.invoke("1", 2))
        assertEquals(null, node.getFunction<Any>("notafunction"))
        assertEquals(null, node.getFunction<Any>("notthere"))
    }

    @Test
    fun getList() {
        val node = buildNodeFromMap(
            "list" to listOf(1, 2, 3),
            "notalist" to 1
        )

        assertEquals(listOf(1, 2, 3), node.getList("list"))
        assertNull(node.getList("notalist"))
        assertNull(node.getList("notthere"))
    }

    @Test
    fun getObject() {
        val node = buildNodeFromMap(
            "object" to mapOf(
                "string" to "thisisastring"
            ),
            "notaobject" to 1234
        )

        assertEquals("thisisastring", node.getObject("object")?.getString("string"))

        assertNull(node.getObject("notaobject"))
        assertNull(node.getObject("notthere"))
    }

    @Test
    fun getAsset() {
        val node = buildNodeFromMap(
            "asset" to mapOf(
                "id" to "testId",
                "type" to "testType"
            )
        )

        val (id, type) = node.getObject("asset") as Asset
        assertEquals(id, "testId")
        assertEquals(type, "testType")
    }

    @Test
    fun getListHandlesObjects() {
        val node = buildNodeFromMap(
            "assets" to listOf(
                mapOf(
                    "id" to "testId1",
                    "type" to "testType"
                ),
                mapOf(
                    "id" to "notAnAsset"
                ),
                1
            ),
            "notassets" to "justastring"
        )

        val assets = node.getList("assets") as List<*>
        assertEquals(3, assets.size)

        val (id, type) = assets.first() as Asset
        assertEquals(id, "testId1")
        assertEquals(type, "testType")

        assertNotNull(assets[1] as V8Node)
        assertNull(assets[1] as? Asset)

        assertEquals(1, assets[2])

        assertNull(node.getList("notassets"))
    }

    @Test
    fun getInt() {
        val node = buildNodeFromMap(
            "int" to 1,
            "notanint" to "asdf"
        )

        assertEquals(1, node.getInt("int"))
        assertNull(node.getInt("notanint"))
        assertNull(node.getInt("notthere"))
    }

    @Test
    fun getJson() {
        val node = buildNodeFromMap(
            "beacon" to mapOf("key" to "value")
        )
        assertEquals(JsonNull, node.getJson("notthere"))
        assertEquals(buildJsonObject { put("key", "value") }, node.getJson("beacon"))
    }

    @Test
    fun toJson() {
        val node = format.v8Object {
            "beacon" to v8Object {
                "key" to "value"
            }
        }.handleValue(format) as Node

        assertEquals(
            buildJsonObject {
                put(
                    "beacon",
                    buildJsonObject {
                        put("key", "value")
                    }
                )
            },
            node.toJson()
        )
    }

    @Test
    fun getBoolean() {
        val node = buildNodeFromMap(
            "isSelected" to true
        )
        assertEquals(true, node.getBoolean("isSelected"))
        assertNull(node.getBoolean("notthere"))
    }

    @Test
    fun testConcurrency() {
        val node = buildNodeFromMap(
            "string" to "thisisastring",
            "int" to 1,
            "object" to mapOf(
                "string" to "anotherstring"
            ),
            "list" to listOf(
                1,
                "two",
                mapOf(
                    "string" to "onemorestring"
                ),
                null
            ),
            "function" to Invokable { "classicstring" },
            "null" to null
        )

        addThreads(
            thread {
                v8.blockingLock {
                    runBlocking { delay(1000) }
                    assertEquals(1, node.getInt("int"))
                }
            },
            thread(false) {
                v8.blockingLock {
                    assertEquals("thisisastring", node["string"])
                }
                v8.blockingLock {
                    assertEquals("thisisastring", node.getString("string"))
                }
                v8.blockingLock {
                    assertEquals(1, node.getInt("int"))
                }
                assertEquals("thisisastring", node.get("string"))
            },
            thread(false) {
                v8.blockingLock {
                    assertEquals("thisisastring", node["string"])
                }
                v8.blockingLock {
                    assertEquals("thisisastring", node.getString("string"))
                }
                v8.blockingLock {
                    assertEquals(1, node.getInt("int"))
                }
                assertEquals("thisisastring", node.get("string"))
            }
        )
        startThreads()
        verifyThreads()
    }

    @Test
    fun getSerializablePrimitive() {
        val node = buildNodeFromMap(
            "number" to 9
        )
        assertEquals(9, node.getSerializable("number", Int.serializer()))
    }

    @Test
    fun getSerializable() {
        val node = buildNodeFromMap(
            "flow" to mapOf(
                "id" to "testId"
            )
        )
        assertEquals("testId", node.getSerializable("flow", Flow.serializer())?.id)
    }
}
