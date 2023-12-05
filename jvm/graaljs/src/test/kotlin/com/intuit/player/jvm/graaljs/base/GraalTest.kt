package com.intuit.player.jvm.graaljs.base

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.graaljs.bridge.runtime.GraalRuntime
import com.intuit.player.jvm.graaljs.bridge.runtime.GraalRuntime.Companion.undefined
import com.intuit.player.jvm.graaljs.bridge.runtime.Runtime
import com.intuit.player.jvm.graaljs.bridge.serialization.format.decodeFromGraalValue
import com.intuit.player.jvm.graaljs.bridge.serialization.format.encodeToGraalValue
import com.intuit.player.jvm.graaljs.extensions.handleValue
import com.intuit.player.jvm.graaljs.player.PlayerContextFactory
import com.intuit.player.jvm.utils.test.PromiseUtils
import com.intuit.player.jvm.utils.test.ThreadUtils
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.buildJsonObject
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.Value
import org.junit.jupiter.api.Assertions

internal abstract class GraalTest(val graal: Context = PlayerContextFactory.buildPlayerContext()) : PromiseUtils, ThreadUtils {

    private val TAG get() = this::class.java.simpleName
    val runtime = Runtime(graal)
    val format = (runtime as GraalRuntime).format

    fun buildNodeFromMap(vararg entries: Pair<String, Any?>) = buildNodeObjectFromMap(mapOf(*entries))
    fun buildV8Object(jsonElement: JsonElement = buildJsonObject {}) = buildV8ObjectFromMap(
        Json.decodeFromJsonElement(
            MapSerializer(String.serializer(), GenericSerializer()),
            jsonElement,
        ),
    )

    fun buildV8ObjectFromMap(map: Map<String, Any?>): Value = format.encodeToGraalValue(map)
    fun buildNodeObjectFromMap(map: Map<String, Any?>): Node = format.encodeToGraalValue(map).let(format::decodeFromGraalValue)

    // PromiseUtils
    override val thenChain = mutableListOf<Any?>()
    override val catchChain = mutableListOf<Any?>()

    // ThreadUtils
    override val threads = mutableListOf<Thread>()
    override val exceptions = mutableListOf<Throwable>()

    fun Value.assertEquivalent(another: Any?) {
        Assertions.assertTrue(
            another is Value,
            "value to compare is not a Graal Object: $another",
        )
        (another as Value).let {
            // verify that all missing keys from another are null or undefined
            (memberKeys.toSet() - another.memberKeys.toSet()).forEach { missingKey ->
                val actual = getMember(missingKey)
                Assertions.assertTrue(actual == null || actual == context.undefined)
            }

            // verify that all missing keys from this are null or undefined
            (another.memberKeys.toSet() - memberKeys.toSet()).forEach { missingKey ->
                val actual = another.getMember(missingKey)
                Assertions.assertTrue(actual == null || actual == context.undefined)
            }

            if (isNull || !hasMembers() || hasArrayElements()) {
                if (!canExecute()) Assertions.assertEquals(this.handleValue(format), another.handleValue(format))
            } else {
                memberKeys.forEach { key ->
                    val (expected, actual) = getMember(key) to another.getMember(key)
                    if (expected is Value && !expected.isNull) {
                        expected.assertEquivalent(actual)
                    } else {
                        Assertions.assertEquals(expected, actual, "comparing key: $key")
                    }
                }
            }
        }
    }
}
