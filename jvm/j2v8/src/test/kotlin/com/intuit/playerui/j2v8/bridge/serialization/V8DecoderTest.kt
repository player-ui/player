package com.intuit.playerui.j2v8.bridge.serialization

import com.eclipsesource.v8.V8
import com.eclipsesource.v8.V8Object
import com.eclipsesource.v8.V8ScriptExecutionException
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.serialization.json.prettify
import com.intuit.playerui.core.bridge.serialization.json.prettyPrint
import com.intuit.playerui.j2v8.V8Function
import com.intuit.playerui.j2v8.V8Value
import com.intuit.playerui.j2v8.base.J2V8Test
import com.intuit.playerui.j2v8.bridge.serialization.format.decodeFromV8Value
import com.intuit.playerui.j2v8.bridge.serialization.format.encodeToV8Value
import com.intuit.playerui.j2v8.extensions.args
import com.intuit.playerui.j2v8.extensions.emptyArgs
import com.intuit.playerui.j2v8.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.j2v8.extensions.invoke
import com.intuit.playerui.j2v8.v8Function
import com.intuit.playerui.j2v8.v8Object
import kotlinx.serialization.Serializable
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/** Legacy tests for encoding values into J2V8 */
internal class V8DecoderTest : J2V8Test() {

    private val retVal = "this is my return"

    @Test
    fun testPrimitives() {
        v8.evaluateInJSThreadBlocking(runtime) {
            listOf(42, 1234L, "string", null, Unit to V8.getUndefined())
                .map { if (it is Pair<*, *>) it else it to V8Value(it) }
                .forEach { (actual, expected) -> assertEquals(expected, format.encodeToV8Value(actual)) }
        }
    }

    @Test
    fun testArray() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val list = listOf(1, 2, 3)
            val v8Array = executeArrayScript("""(${list.prettify()})""")
            val result = format.encodeToV8Value(list)
            v8Array.assertEquivalent(result)
        }
    }

    @Test
    fun testNestedArray() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val list = listOf("a", 2, 3, listOf(4, 5, 6))
            val nestedV8Array = executeArrayScript("""(${list.prettify()})""")
            val result = format.encodeToV8Value(list)
            nestedV8Array.assertEquivalent(result)
        }
    }

    @Test
    fun testObject() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val map = mapOf("a" to "b", "c" to "d")
            val v8Object = executeObjectScript("""(${map.prettify()})""")
            val result = format.encodeToV8Value(map)
            v8Object.assertEquivalent(result)
        }
    }

    @Test
    fun testObjectDynamicKeys() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val map = mapOf(1 to "b", "c" to "d")
            val v8Object = executeObjectScript("""(${map.prettify()})""")
            val result = format.encodeToV8Value(map)
            v8Object.assertEquivalent(result)
        }
    }

    @Test
    fun testNestedObject() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val map = mapOf("a" to "b", "c" to "d")
            val v8Object = executeObjectScript("""(${map.prettify()})""")
            val result = format.encodeToV8Value(map)
            v8Object.assertEquivalent(result)
        }
    }

    @Test
    fun testFunction() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val function = { arg: String -> println(arg); retVal }
            assertEquals(retVal, function("this is my arg"))

            val result = format.encodeToV8Value(function).v8Function
            assertEquals(retVal, result(format, "this is my arg"))
        }
    }

    @Test
    fun testFunctionReturn() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val function = { arg: String -> arg }
            assertEquals("this is my arg", function("this is my arg"))

            val result = format.encodeToV8Value(function).v8Function
            assertEquals("this is my arg", result(format, "this is my arg"))
        }
    }

    @Test
    fun testTooManyParamsOnFunction() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val function = { arg: String -> println(arg); retVal }
            assertEquals(retVal, function("this is my arg"))

            val result = format.encodeToV8Value(function).v8Function
            assertEquals(retVal, result(format, "this is my arg", "this is another arg"))
        }
    }

    @Test
    fun notEnoughParamsOnFunction() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val function = { arg: String? -> println(arg); retVal }
            assertEquals(retVal, function("this is my arg"))

            val result = format.encodeToV8Value(function).v8Function
            assertEquals(retVal, result.call(runtime, format.emptyArgs()))
        }
    }

    @Test
    fun wrongParamsOnFunction() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val function = { arg: String -> println(arg); retVal }
            assertEquals(retVal, function("this is my arg"))

            val result = format.encodeToV8Value(function).v8Function
            assertThrows(V8ScriptExecutionException::class.java) {
                result(format, 1234)
            }
        }
    }

    @Test
    fun testMemberFunction() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val logger = LoggerAsMethod()
            val function = logger::log
            assertEquals(retVal, function("this is my arg"))

            val result = format.encodeToV8Value(function).v8Function
            assertEquals(retVal, result(format, "this is my arg"))
        }
    }

    @Test
    fun testMemberFunctionReturn() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val logger = LoggerAsMethod()
            val function = logger::logAndReturn
            assertEquals("this is my arg", function("this is my arg"))

            val result = format.encodeToV8Value(function).v8Function
            assertEquals("this is my arg", result(format, "this is my arg"))
        }
    }

    @Test
    fun testTooManyParamsOnMemberFunction() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val logger = LoggerAsMethod()
            val function = logger::log
            assertEquals(retVal, function("this is my arg"))

            val result = format.encodeToV8Value(function).v8Function
            assertEquals(retVal, result(format, "this is my arg", "this is another arg"))
        }
    }

    @Test
    fun notEnoughParamsOnMemberFunction() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val logger = LoggerAsMethod()
            val function = logger::log
            assertEquals(retVal, function("this is my arg"))

            val result = format.encodeToV8Value(function).v8Function
            assertEquals(retVal, result(format))
        }
    }

    @Test
    fun wrongParamsOnMemberFunction() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val logger = LoggerAsMethod()
            val function = logger::log
            assertEquals(retVal, function("this is my arg"))

            val result = format.encodeToV8Value(function).v8Function
            assertThrows(V8ScriptExecutionException::class.java) {
                result(format, 1234)
            }
        }
    }

    @Test
    fun varargParams() {
        val argsAsList = listOf("arg1", "arg2", null, "arg3", 42)

        class ComplicatedVarargMethod {
            fun log(someArg: String, vararg args: Any?) {
                assertEquals("someArg", someArg)
                assertEquals(argsAsList, args.toList())
            }
        }

        v8.evaluateInJSThreadBlocking(runtime) {
            val logger = ComplicatedVarargMethod()
            val function = logger::log
            // assertEquals(retVal, function("someArg", argsAsList.toTypedArray(), 42))
            function("someArg", argsAsList.toTypedArray())

            val result = format.encodeToV8Value(function).v8Function
            result(format, "someArg", *argsAsList.toTypedArray())
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
            val result = format.encodeToV8Value(complex)
            v8Object.assertEquivalent(result)
        }
    }

    @Serializable
    data class TestClass1(
        val one: Int,
        val string: String,
    )

    @Test
    fun testV8ValueDecoding() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val testClass = TestClass1(1, "string")

            val obj = executeObjectScript("""(${testClass.prettify(TestClass1.serializer())})""")
            val decodedObj = format.encodeToV8Value(testClass) as V8Object

            obj.assertEquivalent(decodedObj)

            val mapTestClass = mapOf(
                "one" to 1,
                "string" to "string",
            )

            val encodedMapTestClass = format.decodeFromV8Value<Any>(obj)
            assertEquals(mapTestClass, encodedMapTestClass)

            val encodedMapTestClassFromDecoded = format.decodeFromV8Value<Map<String, Any?>>(decodedObj)
            assertEquals(testClass.string, encodedMapTestClassFromDecoded["string"])

            val encodedTestClass = format.decodeFromRuntimeValue(TestClass1.serializer(), obj)
            assertEquals(testClass, encodedTestClass)

            val encodedTestClassFromDecoded = format.decodeFromRuntimeValue(TestClass1.serializer(), decodedObj)
            assertEquals(testClass, encodedTestClassFromDecoded)
        }
    }

    @Serializable
    data class TestClass2(
        val one: Int,
        val string: String,
        val method: (name: String) -> Boolean,
    )

    @Test
    fun testV8ValueDecodingWithFunctionType() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val testClass = TestClass2(1, "string") {
                println("$it called me!")
                return@TestClass2 true
            }

            add(
                "f",
                V8Function(format) {
                    println("$it called me!")
                    true
                },
            )
            val obj = executeObjectScript("""({one: 1, string: "string", method: f})""")
            val decodedObj = format.encodeToV8Value(testClass).v8Object

            obj.assertEquivalent(decodedObj)

            val mapTestClass = mapOf(
                "one" to 1,
                "string" to "string",
            )

            val encodedMapTestClass = format.decodeFromV8Value<Map<String, Any?>>(obj)
            val encodedMethod = encodedMapTestClass["method"] as Invokable<Boolean>
            assertTrue(encodedMethod("encodedMapTestClass"))
            assertEquals(mapTestClass, encodedMapTestClass.filter { (k) -> k != "method" })

            val encodedMapTestClassFromDecoded = format.decodeFromV8Value<Map<String, Any?>>(decodedObj)
            assertEquals(testClass.method("testClass"), (encodedMapTestClassFromDecoded["method"] as Invokable<*>)("encodedMapTestClassFromDecoded"))

            val encodedTestClass = format.decodeFromRuntimeValue(TestClass2.serializer(), obj)
            assertTrue(encodedTestClass.method("encodedTestClass"))

            val encodedTestClassFromDecoded = format.decodeFromRuntimeValue(TestClass2.serializer(), decodedObj)
            assertTrue(encodedTestClassFromDecoded.method("encodedTestClassFromDecoded"))

            val decodedObjectFromTestClass = format.encodeToV8Value(testClass).v8Object
            assertEquals(true, decodedObjectFromTestClass.executeFunction("method", format.args("decodedObjectFromTestClass")))
        }
    }

    @Serializable
    data class TestClass3(
        val one: Int,
        val string: String,
        val method: Invokable<Boolean>?,
    )

    @Test
    fun testV8ValueDecodingWithInvokableType() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val testClass = TestClass3(
                1,
                "string",
                Invokable {
                    println("${it.firstOrNull()} called me!")
                    return@Invokable true
                },
            )

            add(
                "f",
                V8Function(format) {
                    println("$it called me!")
                    true
                },
            )
            val obj = executeObjectScript("""({one: 1, string: "string", method: f})""")
            val decodedObj = format.encodeToV8Value(testClass) as V8Object
            assertEquals(true, decodedObj.executeFunction("method", format.args("decodedObjectFromTestClass")))

            obj.assertEquivalent(decodedObj)

            val mapTestClass = mapOf(
                "one" to 1,
                "string" to "string",
            )

            val encodedMapTestClass = format.decodeFromV8Value<Map<String, Any?>>(obj)
            val encodedMethod = encodedMapTestClass["method"] as Invokable<*>
            assertEquals(true, encodedMethod("encodedMapTestClass"))
            assertEquals(mapTestClass, encodedMapTestClass.filter { (k) -> k != "method" })

            val encodedMapTestClassFromDecoded = format.decodeFromV8Value<Map<String, Any?>>(decodedObj)
            assertEquals(testClass.method!!("testClass"), (encodedMapTestClassFromDecoded["method"] as Invokable<*>)("encodedMapTestClassFromDecoded"))

            val encodedTestClass = format.decodeFromRuntimeValue(TestClass3.serializer(), obj)
            assertTrue(encodedTestClass.method!!("encodedTestClass"))

            val encodedTestClassFromDecoded = format.decodeFromRuntimeValue(TestClass3.serializer(), decodedObj)
            assertTrue(encodedTestClassFromDecoded.method!!("encodedTestClassFromDecoded"))

            val decodedObjectFromTestClass = format.encodeToV8Value(testClass) as V8Object
            assertEquals(true, decodedObjectFromTestClass.executeFunction("method", format.args("decodedObjectFromTestClass")))
        }
    }

    @Serializable
    data class TestClass4(
        val one: Int,
        val string: String,
        val nested: TestClass4? = null,
    )

    @Test
    fun testV8ValueDecodingWithNestedDataClass() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val testClass = TestClass4(1, "string", TestClass4(2, "another"))

            testClass.prettyPrint(TestClass4.serializer())

            val obj = executeObjectScript("""(${testClass.prettify(TestClass4.serializer())})""")
            val decodedObj = format.encodeToV8Value(testClass).v8Object

            obj.assertEquivalent(decodedObj)

            val mapTestClass = mapOf(
                "one" to 1,
                "string" to "string",
                "nested" to mapOf(
                    "one" to 2,
                    "string" to "another",
                ),
            )

            val encodedMapTestClass = format.decodeFromV8Value<Map<String, Any?>>(obj)
            assertEquals(mapTestClass, encodedMapTestClass)

            val encodedMapTestClassFromDecoded = format.decodeFromV8Value<Map<String, Any?>>(decodedObj)
            assertEquals(testClass.string, encodedMapTestClassFromDecoded["string"])

            val encodedTestClass = format.decodeFromRuntimeValue(TestClass4.serializer(), obj)
            assertEquals(testClass, encodedTestClass)

            val encodedTestClassFromDecoded = format.decodeFromRuntimeValue(TestClass4.serializer(), decodedObj)
            assertEquals(testClass, encodedTestClassFromDecoded)
        }
    }

    @Serializable
    data class TestClass5(
        val one: Int,
        val string: String,
        val nested: TestClass6,
    )

    @Serializable
    data class TestClass6(
        val two: String,
        val string: Int,
    )

    @Test
    fun testV8ValueDecodingWithComplexDataClass() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val testClass = TestClass5(1, "string", TestClass6("another", 2))

            testClass.prettyPrint(TestClass5.serializer())

            val obj = executeObjectScript("""(${testClass.prettify(TestClass5.serializer())})""")
            val decodedObj = format.encodeToV8Value(testClass) as V8Object

            obj.assertEquivalent(decodedObj)

            val mapTestClass = mapOf(
                "one" to 1,
                "string" to "string",
                "nested" to mapOf(
                    "two" to "another",
                    "string" to 2,
                ),
            )

            val encodedMapTestClass = format.decodeFromV8Value<Map<String, Any?>>(obj)
            assertEquals(mapTestClass, encodedMapTestClass)

            val encodedMapTestClassFromDecoded = format.decodeFromV8Value<Map<String, Any?>>(decodedObj)
            assertEquals(testClass.string, encodedMapTestClassFromDecoded["string"])

            val encodedTestClass = format.decodeFromRuntimeValue(TestClass5.serializer(), obj)
            assertEquals(testClass, encodedTestClass)

            val encodedTestClassFromDecoded = format.decodeFromRuntimeValue(TestClass5.serializer(), decodedObj)
            assertEquals(testClass, encodedTestClassFromDecoded)
        }
    }

    @Serializable
    class LoggerAsValue(
        var TAG: String = "Logger As Value",
    ) {
        private val retVal = "this is my return"
        val log: ((String?) -> String)? = { println(TAG); println(it); retVal }
        val superLog: (String, Int, String) -> String = { arg1, arg2, arg3 -> println(TAG); println(arg1); println(arg2); println(arg3); retVal }
    }

    @Serializable
    class LoggerAsMethod {
        var TAG = "Logger As Method"
        private val retVal = "this is my return"

        fun log(message: String?): String {
            println(TAG)
            println(message)
            return retVal
        }

        fun logAndReturn(message: String): String {
            println(TAG)
            println(message)
            return message
        }
    }
}
