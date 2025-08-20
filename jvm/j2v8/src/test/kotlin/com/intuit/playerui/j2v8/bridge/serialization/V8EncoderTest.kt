package com.intuit.playerui.j2v8.bridge.serialization

import com.eclipsesource.v8.V8Function
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.serialization.json.prettify
import com.intuit.playerui.j2v8.V8Function
import com.intuit.playerui.j2v8.base.J2V8Test
import com.intuit.playerui.j2v8.bridge.serialization.format.decodeFromV8Value
import com.intuit.playerui.j2v8.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.j2v8.extensions.invoke
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

/** Legacy tests for decoding values from J2V8 */
internal class V8EncoderTest : J2V8Test() {
    @Test
    fun testArray() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val list = listOf(1, 2, 3)
            val v8Array = executeArrayScript("""(${list.prettify()})""")
            val result = format.decodeFromV8Value<List<Int>>(v8Array)
            assertEquals(list, result)
        }
    }

    @Test
    fun testNestedArray() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val list = listOf("a", 2, 3, listOf(4, 5, 6))
            val nestedV8Array = executeArrayScript("""(${list.prettify()})""")
            val result: List<Any?> = format.decodeFromV8Value(nestedV8Array)
            assertEquals(list, result)
        }
    }

    @Test
    fun testObject() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val map = mapOf("a" to "b", "c" to "d")
            val v8Object = executeObjectScript("""(${map.prettify()})""")
            val result = format.decodeFromV8Value<Map<String, String>>(v8Object)
            assertEquals(map, result)
        }
    }

    @Test
    fun testObjectDynamicKeysAreConvertedToStrings() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val map = mapOf(1 to "b", "c" to "d")
            val v8Object = executeObjectScript("""(${map.prettify()})""")
            val result = format.decodeFromV8Value<Map<String, String>>(v8Object)
            assertEquals(mapOf("1" to "b", "c" to "d"), result)
        }
    }

    @Test
    fun testNestedObject() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val map = mapOf("a" to mapOf("b" to "c"), "d" to mapOf("e" to "f"))
            val v8Object = executeObjectScript("""(${map.prettify()})""")
            val result = format.decodeFromV8Value<Map<String, Map<String, String>>>(v8Object)
            assertEquals(map, result)
        }
    }

    @Test
    fun testFunction() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val retVal = "this is my return"
            val v8Function = V8Function(format) { args ->
                println(args.get(0))
                retVal
            }
            assertEquals(retVal, v8Function(format, "this is my arg"))

            val result = format.decodeFromV8Value<Invokable<Any?>>(v8Function)
            assertEquals(retVal, result("this is my arg"))
        }
    }

    @Test
    fun testContainedFunction() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val retVal = "this is my return"
            add(
                "func",
                V8Function(format) { args ->
                    println(args.get(0))
                    retVal
                },
            )
            val functionContainer = executeObjectScript("""({ log: func })""")
            val v8Function = functionContainer.getObject("log") as? V8Function
                ?: throw AssertionError("log is not a V8Function")

            assertEquals(retVal, v8Function(format, "this is my arg"))

            val result = format.decodeFromV8Value<Invokable<Any?>>(v8Function)
            assertEquals(retVal, result("this is my arg"))
        }
    }

    @Test
    fun testComplexStructure() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val complex = mapOf(
                "string" to "thisisastring",
                "int" to 1,
                "object" to mapOf(
                    "string" to "anotherstring",
                ),
                "list" to listOf(
                    1,
                    "two",
                    listOf(
                        "a",
                        "b",
                        "c",
                    ),
                    mapOf(
                        "string" to "onemorestring",
                    ),
                    null,
                ),
                "null" to null,
            )
            val v8Object = executeObjectScript("""(${complex.prettify()})""")
            val result: Any? = format.decodeFromV8Value(v8Object)
            assertEquals(complex, result)
        }
    }
}
