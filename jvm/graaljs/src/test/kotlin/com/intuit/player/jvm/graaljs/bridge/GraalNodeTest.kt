package com.intuit.player.jvm.graaljs.bridge

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.getJson
import com.intuit.player.jvm.core.bridge.toJson
import com.intuit.player.jvm.core.flow.Flow
import com.intuit.player.jvm.graaljs.base.GraalTest
import com.intuit.player.jvm.graaljs.extensions.blockingLock
import com.intuit.player.jvm.graaljs.extensions.handleValue
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import kotlin.concurrent.thread

internal class GraalNodeTest : GraalTest() {
    @Test
    fun get() = format.context.blockingLock {
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

        Assertions.assertEquals("thisisastring", node["string"])
        Assertions.assertEquals(1, node["int"])
        Assertions.assertEquals("anotherstring", (node["object"] as GraalNode)["string"])
        Assertions.assertEquals(1, (node["list"] as List<*>)[0])
        Assertions.assertEquals("two", (node["list"] as List<*>)[1])
        Assertions.assertEquals("onemorestring", ((node["list"] as List<*>)[2] as GraalNode)["string"])
        Assertions.assertEquals(null, (node["list"] as List<*>)[3])
        Assertions.assertEquals("classicstring", (node["function"] as Invokable<*>)())
        Assertions.assertEquals(null, node["null"])
    }

    @Test
    fun getString() {
        val node = buildNodeFromMap(
            "string" to "string",
            "notastring" to 1
        )

        Assertions.assertEquals("string", node.getString("string"))
        Assertions.assertNull(node.getString("notastring"))
        Assertions.assertNull(node.getString("notthere"))
    }

    @Test
    fun getFunction() = format.context.blockingLock {
        val node = buildNodeFromMap(
            "function" to Invokable { "classicstring" },
            "tuple" to Invokable { (p0, p1) -> listOf(p0, p1) },
            "notafunction" to 1
        )

        Assertions.assertEquals("classicstring", node.getInvokable<String>("function")?.invoke())
        Assertions.assertEquals(listOf("1", 2), node.getInvokable<Any?>("tuple")?.invoke("1", 2))
        Assertions.assertEquals(null, node.getInvokable<Any>("notafunction"))
        Assertions.assertEquals(null, node.getInvokable<Any>("notthere"))
    }

    @Test
    fun getList() {
        val node = buildNodeFromMap(
            "list" to listOf(1, 2, 3),
            "notalist" to 1
        )

        Assertions.assertEquals(listOf(1, 2, 3), node.getList("list"))
        Assertions.assertNull(node.getList("notalist"))
        Assertions.assertNull(node.getList("notthere"))
    }

    @Test
    fun getObject() {
        val node = buildNodeFromMap(
            "object" to mapOf(
                "string" to "thisisastring"
            ),
            "notaobject" to 1234
        )

        Assertions.assertEquals("thisisastring", node.getObject("object")?.getString("string"))

        Assertions.assertNull(node.getObject("notaobject"))
        Assertions.assertNull(node.getObject("notthere"))
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
        Assertions.assertEquals(id, "testId")
        Assertions.assertEquals(type, "testType")
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
        Assertions.assertEquals(3, assets.size)

        val (id, type) = assets.first() as Asset
        Assertions.assertEquals(id, "testId1")
        Assertions.assertEquals(type, "testType")

        Assertions.assertNotNull(assets[1] as GraalNode)
        Assertions.assertNull(assets[1] as? Asset)

        Assertions.assertEquals(1, assets[2])

        Assertions.assertNull(node.getList("notassets"))
    }

    @Test
    fun getInt() {
        val node = buildNodeFromMap(
            "int" to 1,
            "notanint" to "asdf"
        )

        Assertions.assertEquals(1, node.getInt("int"))
        Assertions.assertNull(node.getInt("notanint"))
        Assertions.assertNull(node.getInt("notthere"))
    }

    @Test
    fun getJson() {
        val node = buildNodeFromMap(
            "beacon" to mapOf("key" to "value")
        )
        Assertions.assertEquals(JsonNull, node.getJson("notthere"))
        Assertions.assertEquals(buildJsonObject { put("key", "value") }, node.getJson("beacon"))
    }

    @Test
    fun toJson() {
        val graalObject = format.context.blockingLock {
            eval("js", "new Object()").apply {
                putMember("beacon", eval("js", "new Object()").apply { putMember("key", "value") })
            }
        }
        val node = graalObject.handleValue(format) as Node

        Assertions.assertEquals(
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
        Assertions.assertEquals(true, node.getBoolean("isSelected"))
        Assertions.assertNull(node.getBoolean("notthere"))
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
                format.context.blockingLock {
                    runBlocking { delay(1000) }
                    Assertions.assertEquals(1, node.getInt("int"))
                }
            },
            thread(false) {
                format.context.blockingLock {
                    Assertions.assertEquals("thisisastring", node["string"])
                }
                format.context.blockingLock {
                    Assertions.assertEquals("thisisastring", node.getString("string"))
                }
                format.context.blockingLock {
                    Assertions.assertEquals(1, node.getInt("int"))
                }
                Assertions.assertEquals("thisisastring", node.get("string"))
            },
            thread(false) {
                format.context.blockingLock {
                    Assertions.assertEquals("thisisastring", node["string"])
                }
                format.context.blockingLock {
                    Assertions.assertEquals("thisisastring", node.getString("string"))
                }
                format.context.blockingLock {
                    Assertions.assertEquals(1, node.getInt("int"))
                }
                Assertions.assertEquals("thisisastring", node.get("string"))
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
        Assertions.assertEquals(9, node.getSerializable("number", Int.serializer()))
    }

    @Test
    fun getSerializable() {
        val node = buildNodeFromMap(
            "flow" to mapOf(
                "id" to "testId"
            )
        )
        Assertions.assertEquals("testId", node.getSerializable("flow", Flow.serializer())?.id)
    }
}
