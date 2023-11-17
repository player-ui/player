package com.intuit.player.jvm.core.bridge

import com.intuit.player.jvm.utils.test.RuntimeTest
import com.intuit.player.jvm.utils.test.runBlockingTest
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.addJsonArray
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate

internal class JsonPromiseTest : RuntimeTest() {

    @TestTemplate
    fun testChain() {
        val result = runBlockingTest {
            runtime.Promise.resolve(42)
                .then<JsonElement> {
                    assertTrue(it is JsonPrimitive)
                    assertEquals(JsonPrimitive(42), it)
                    JsonPrimitive(52)
                }.then<JsonElement> {
                    assertTrue(it is JsonPrimitive)
                    assertEquals(JsonPrimitive(52), it)
                    62
                }.toCompletable<Int>().await()
        }

        assertEquals(62, result)
    }

    @TestTemplate
    fun testInt() {
        val result = runBlockingTest {
            runtime.Promise.resolve(42).toCompletable<JsonElement>().await()
        }
        assertTrue(result is JsonPrimitive)
        assertEquals(JsonPrimitive(42), result)
    }

    @TestTemplate
    fun testString() {
        val result = runBlockingTest {
            runtime.Promise.resolve("testString").toCompletable<JsonElement>().await()
        }
        assertTrue(result is JsonPrimitive)
        assertEquals(JsonPrimitive("testString"), result)
    }

    @TestTemplate
    fun testObject() {
        val result = runBlockingTest {
            runtime.Promise.resolve(mapOf("a" to "b")).toCompletable<JsonElement>().await()
        }
        assertTrue(result is JsonObject)
        assertEquals(
            buildJsonObject {
                put("a", "b")
            },
            result,
        )
    }

    @TestTemplate
    fun testNestedObject() {
        val result = runBlockingTest {
            runtime.Promise.resolve(mapOf("a" to "b", "c" to mapOf("d" to "e"))).toCompletable<JsonElement>().await()
        }
        assertTrue(result is JsonObject)
        assertEquals(
            buildJsonObject {
                put("a", "b")
                put(
                    "c",
                    buildJsonObject {
                        put("d", "e")
                    },
                )
            },
            result,
        )
    }

    @TestTemplate
    fun testArray() {
        val result = runBlockingTest {
            runtime.Promise.resolve(listOf(1, 2, 3)).toCompletable<JsonElement>().await()
        }
        assertTrue(result is JsonArray)
        assertEquals(
            buildJsonArray {
                add((1 as Number))
                add((2 as Number))
                add((3 as Number))
            },
            result,
        )
    }

    @TestTemplate
    fun testNestedArray() {
        val result = runBlockingTest {
            runtime.Promise.resolve(listOf(1, 2, 3, listOf(4, 5))).toCompletable<JsonElement>().await()
        }
        assertTrue(result is JsonArray)
        assertEquals(
            buildJsonArray {
                add((1 as Number))
                add((2 as Number))
                add((3 as Number))
                addJsonArray {
                    add((4 as Number))
                    add((5 as Number))
                }
            },
            result,
        )
    }
}
