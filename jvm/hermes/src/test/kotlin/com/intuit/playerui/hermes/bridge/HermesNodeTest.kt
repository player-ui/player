package com.intuit.playerui.hermes.bridge

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.getJson
import com.intuit.playerui.core.bridge.toJson
import com.intuit.playerui.core.flow.Flow
import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.hermes.extensions.toNode
import com.intuit.playerui.jsi.Function
import com.intuit.playerui.jsi.HostFunction
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.format.`object`
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import kotlin.concurrent.thread

/** Each method should test correct get, incorrect type, and key not found */
internal class HermesNodeTest : HermesTest() {

    @Test
    fun get() {
//        val node = format.`object` {
//            set("string",  "thisisastring")
//            set("int", 1)
//            set("object", mapOf("string" to "anotherstring"))
//            set("list", listOf(1, "two", mapOf("string" to "onemorestring"), null))
//            set("function", Invokable { "classicstring" })
//            set("null", null)
//        }.toNode(format)
        val node = Value.createFromJson(runtime, buildJsonObject {
            put("string",  "thisisastring")
            put("int", 1)
            put("object", buildJsonObject { put("string", "anotherstring") })
            put("list", buildJsonArray {
                add(1)
                add("two")
                add(buildJsonObject { put("string", "onemorestring") })
                add(JsonNull)
            })
            put("null", JsonNull)
        }).asObject(runtime).apply {
            setProperty(runtime, "function", Function.createFromHostFunction(runtime, "function", 0, HostFunction { r, t, a ->
                Value.from(runtime,"classicstring")
            }).asValue())
        }.toNode(format)

        assertEquals("thisisastring", node["string"])
        assertEquals(1.0, node["int"])
        assertEquals("anotherstring", (node["object"] as Node)["string"])
        assertEquals(1.0, (node["list"] as List<*>)[0])
        assertEquals("two", (node["list"] as List<*>)[1])
        assertEquals("onemorestring", ((node["list"] as List<*>)[2] as Node)["string"])
        assertEquals(null, (node["list"] as List<*>)[3])
        assertEquals("classicstring", (node["function"] as Invokable<*>)())
        assertEquals(null, node["null"])
    }

//    @Test
    fun getString() {
        val node = format.`object` {
            set("string", "string")
            set("notastring", 1)
        }.toNode(format)

        assertEquals("string", node.getString("string"))
        assertNull(node.getString("notastring"))
        assertNull(node.getString("notthere"))
    }

//    @Test
    fun getFunction() {
        val node = format.`object` {
            set("function", Invokable { "classicstring" })
            set("tuple", Invokable { (p0, p1) -> listOf(p0, p1) })
            set("notafunction", 1)
        }.toNode(format)

        assertEquals("classicstring", node.getInvokable<String>("function")?.invoke())
        assertEquals(listOf("1", 2), node.getInvokable<Any?>("tuple")?.invoke("1", 2))
        assertEquals(null, node.getInvokable<Any>("notafunction"))
        assertEquals(null, node.getInvokable<Any>("notthere"))
    }

//    @Test
    fun getList() {
        val node = format.`object` {
            set("list", listOf(1, 2, 3))
            set("notalist", 1)
        }.toNode(format)

        assertEquals(listOf(1, 2, 3), node.getList("list"))
        assertNull(node.getList("notalist"))
        assertNull(node.getList("notthere"))
    }

//    @Test
    fun getObject() {
        val node = format.`object` {
            set("object", mapOf(
                "string" to "thisisastring",
            ))
            set("notaobject", 1234)
        }.toNode(format)

        assertEquals("thisisastring", node.getObject("object")?.getString("string"))

        assertNull(node.getObject("notaobject"))
        assertNull(node.getObject("notthere"))
    }

//    @Test
    fun getAsset() {
        val node = format.`object` {
            set("asset", mapOf("id" to "testId", "type" to "testType"))
        }.toNode(format)

        val (id, type) = node.getObject("asset") as Asset
        assertEquals(id, "testId")
        assertEquals(type, "testType")
    }

//    @Test
    fun getListHandlesObjects() {
        val node = format.`object` {
            set("assets", listOf(
                mapOf(
                    "id" to "testId1",
                    "type" to "testType",
                ),
                mapOf(
                    "id" to "notAnAsset",
                ),
                1,
            ))
            set("notassets", "justastring")
        }.toNode(format)

        val assets = node.getList("assets") as List<*>
        assertEquals(3, assets.size)

        val (id, type) = assets.first() as Asset
        assertEquals(id, "testId1")
        assertEquals(type, "testType")

        assertNotNull(assets[1] as Node)
        assertNull(assets[1] as? Asset)

        assertEquals(1, assets[2])

        assertNull(node.getList("notassets"))
    }

//    @Test
    fun getInt() {
        val node = format.`object` {
            set("int", 1)
            set("notanint", "asdf")
        }.toNode(format)

        assertEquals(1, node.getInt("int"))
        assertNull(node.getInt("notanint"))
        assertNull(node.getInt("notthere"))
    }

//    @Test
    fun getJson() {
        val node = format.`object` {
            set("beacon", mapOf("key" to "value"))
        }.toNode(format)
        assertEquals(JsonNull, node.getJson("notthere"))
        assertEquals(buildJsonObject { put("key", "value") }, node.getJson("beacon"))
    }

//    @Test
    fun toJson() {
        val node = format.`object` {
            set("beacon", mapOf("key" to "value"))
        }.toNode(format)

        assertEquals(
            buildJsonObject {
                put(
                    "beacon",
                    buildJsonObject {
                        put("key", "value")
                    },
                )
            },
            node.toJson(),
        )
    }

//    @Test
    fun getBoolean() {
        val node = format.`object` {
            set("isSelected", true)
        }.toNode(format)
        assertEquals(true, node.getBoolean("isSelected"))
        assertNull(node.getBoolean("notthere"))
    }

//    @Test
    fun testConcurrency() {
        val node = format.`object` {
            set("string",  "thisisastring")
            set("int", 1)
            set("object", mapOf("string" to "anotherstring"))
            set("list", listOf(1, "two", mapOf("string" to "onemorestring"), null))
            set("function", Invokable { "classicstring" })
            set("null", null)
        }.toNode(format)

        addThreads(
            thread {
//                v8.evaluateInJSThreadBlocking(runtime) {
                    runBlocking { delay(1000) }
                    assertEquals(1, node.getInt("int"))
//                }
            },
            thread(false) {
//                v8.evaluateInJSThreadBlocking(runtime) {
                    assertEquals("thisisastring", node["string"])
//                }
//                v8.evaluateInJSThreadBlocking(runtime) {
                    assertEquals("thisisastring", node.getString("string"))
//                }
//                v8.evaluateInJSThreadBlocking(runtime) {
                    assertEquals(1, node.getInt("int"))
//                }
                assertEquals("thisisastring", node.get("string"))
            },
            thread(false) {
//                v8.evaluateInJSThreadBlocking(runtime) {
                    assertEquals("thisisastring", node["string"])
//                }
//                v8.evaluateInJSThreadBlocking(runtime) {
                    assertEquals("thisisastring", node.getString("string"))
//                }
//                v8.evaluateInJSThreadBlocking(runtime) {
                    assertEquals(1, node.getInt("int"))
//                }
                assertEquals("thisisastring", node.get("string"))
            },
        )
        startThreads()
        verifyThreads()
    }

//    @Test
    fun getSerializablePrimitive() {
        val node = format.`object` {
            set("number", 9)
        }.toNode(format)
        assertEquals(9, node.getSerializable("number", Int.serializer()))
    }

//    @Test
    fun getSerializable() {
        val node = format.`object` {
            set("flow", mapOf(
                "id" to "testId",
            ))
        }.toNode(format)
        assertEquals("testId", node.getSerializable("flow", Flow.serializer())?.id)
    }
}
