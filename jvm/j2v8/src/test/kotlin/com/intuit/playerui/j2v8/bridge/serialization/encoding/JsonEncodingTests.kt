package com.intuit.playerui.j2v8.bridge.serialization.encoding

import com.intuit.playerui.core.flow.FlowResult
import com.intuit.playerui.j2v8.base.J2V8Test
import com.intuit.playerui.j2v8.bridge.V8Node
import com.intuit.playerui.j2v8.bridge.serialization.format.encodeToV8Value
import com.intuit.playerui.j2v8.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.j2v8.v8Object
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class JsonEncodingTests : J2V8Test() {
    private val expectedJson = buildJsonObject {
        put("data", buildJsonObject { put("a", "b") })
        put(
            "endState",
            buildJsonObject {
                put("state_type", "END")
                put("outcome", "doneWithTopic")
            },
        )
    }
    private val expectedJsonString = expectedJson.toString()
    private val expectedV8Object = v8.evaluateInJSThreadBlocking(runtime) {
        executeObjectScript("""($expectedJsonString)""")
    }
    private val expectedFlowResult = FlowResult(V8Node(expectedV8Object, runtime))

    @Test
    fun testStringify() {
        val stringified = Json.encodeToString(expectedFlowResult)
        Assertions.assertEquals(expectedJsonString, stringified)
    }

    @Test
    fun testToJson() {
        val json = format.decodeFromRuntimeValue(JsonElement.serializer(), expectedV8Object)
        Assertions.assertEquals(expectedJson, json)
    }

    @Test
    fun testToV8() {
        expectedV8Object.evaluateInJSThreadBlocking(runtime) {
            expectedV8Object.assertEquivalent(format.encodeToV8Value(expectedFlowResult))
        }
    }

    @Test
    fun testFromV8() {
        val flow = format.decodeFromRuntimeValue(FlowResult.serializer(), expectedV8Object)
        Assertions.assertEquals(expectedFlowResult, flow)
    }

    @Test
    fun testToAndFromV8() {
        expectedV8Object.evaluateInJSThreadBlocking(runtime) {
            val v8Object = format.encodeToV8Value(expectedFlowResult).v8Object
            expectedV8Object.assertEquivalent(v8Object)

            val flow = format.decodeFromRuntimeValue(FlowResult.serializer(), v8Object)
            Assertions.assertEquals(expectedFlowResult, flow)
        }
    }
}
