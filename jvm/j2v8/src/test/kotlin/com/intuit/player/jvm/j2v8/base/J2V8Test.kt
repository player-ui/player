package com.intuit.player.jvm.j2v8.base

import com.eclipsesource.v8.V8
import com.eclipsesource.v8.V8Array
import com.eclipsesource.v8.V8Object
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.serialization.json.prettyPrint
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.j2v8.bridge.runtime.Runtime
import com.intuit.player.jvm.j2v8.bridge.runtime.V8Runtime
import com.intuit.player.jvm.j2v8.bridge.serialization.format.decodeFromV8Value
import com.intuit.player.jvm.j2v8.bridge.serialization.format.encodeToV8Value
import com.intuit.player.jvm.j2v8.extensions.evaluateInJSThreadBlocking
import com.intuit.player.jvm.j2v8.extensions.evaluateInJSThreadIfDefinedBlocking
import com.intuit.player.jvm.j2v8.extensions.unlock
import com.intuit.player.jvm.j2v8.v8Object
import com.intuit.player.jvm.utils.test.PromiseUtils
import com.intuit.player.jvm.utils.test.ThreadUtils
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.buildJsonObject
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach

internal abstract class J2V8Test(val v8: V8 = V8.createV8Runtime().unlock()) : PromiseUtils, ThreadUtils {

    private val TAG get() = this::class.java.simpleName
    val runtime = Runtime(v8)
    val format = (runtime as V8Runtime).format

    fun buildNodeFromMap(vararg entries: Pair<String, Any?>) = buildNodeObjectFromMap(mapOf(*entries))
    fun buildV8Object(jsonElement: JsonElement = buildJsonObject {}) = buildV8ObjectFromMap(
        Json.decodeFromJsonElement(
            MapSerializer(String.serializer(), GenericSerializer()),
            jsonElement,
        ),
    )

    fun buildV8ObjectFromMap(map: Map<String, Any?>): V8Object = format.encodeToV8Value(map).v8Object
    fun buildNodeObjectFromMap(map: Map<String, Any?>): Node = format.encodeToV8Value(map).v8Object.let(format::decodeFromV8Value)

    // PromiseUtils
    override val thenChain = mutableListOf<Any?>()
    override val catchChain = mutableListOf<Any?>()

    // ThreadUtils
    override val threads = mutableListOf<Thread>()
    override val exceptions = mutableListOf<Throwable>()

    @BeforeEach
    fun resetGlobalLog() {
        v8.evaluateInJSThreadIfDefinedBlocking(runtime) {
            val globalLog = V8Array(this)
            add("globalLog", globalLog)
            globalLog.close()
        }
    }

    fun flushRuntimeLogs() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val globalLog = getArray("globalLog")
            globalLog.keys.map { globalLog.get(it) }.forEach { it.prettyPrint() }
            globalLog.close()
            resetGlobalLog()
        }
    }

    /**
     * Nested [V8Object] assertion utility method
     */
    fun V8Object.assertEquivalent(another: Any?) {
        assertTrue(
            another is V8Object,
        ) { "value to compare is not a V8Object: $another" }

        (another as V8Object).let {
            // verify that all missing keys from another are null or undefined
            (keys.toSet() - another.keys.toSet()).forEach { missingKey ->
                val actual = get(missingKey)
                assertTrue(actual == null || actual == V8.getUndefined())
            }

            // verify that all missing keys from this are null or undefined
            (another.keys.toSet() - keys.toSet()).forEach { missingKey ->
                val actual = another.get(missingKey)
                assertTrue(actual == null || actual == V8.getUndefined())
            }

            if (isUndefined) {
                assertEquals(this, another)
            } else {
                keys.forEach { key ->
                    val (expected, actual) = get(key) to another.get(key)
                    if (expected is V8Object && !expected.isUndefined) {
                        expected.assertEquivalent(actual)
                    } else {
                        assertEquals(expected, actual, "comparing key: $key")
                    }
                }
            }
        }
    }
}
