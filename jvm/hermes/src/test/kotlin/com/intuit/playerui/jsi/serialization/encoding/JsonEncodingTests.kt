package com.intuit.playerui.jsi.serialization.encoding

import com.intuit.playerui.core.flow.FlowResult
import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.hermes.bridge.HermesNode
import com.intuit.playerui.hermes.extensions.RuntimeThreadContext
import com.intuit.playerui.hermes.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.format.encodeToValue
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class JsonEncodingTests : HermesTest() {
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
    context(RuntimeThreadContext)
    private val expectedValue get() = Value.createFromJson(runtime, expectedJson)
    context(RuntimeThreadContext)
    private val expectedObject get() = expectedValue.asObject(runtime)
    context(RuntimeThreadContext)
    private val expectedFlowResult get() = FlowResult(HermesNode(expectedObject, runtime))

    @Test
    fun testStringify() = runtime.evaluateInJSThreadBlocking {
        val stringified = Json.encodeToString(expectedFlowResult)
        Assertions.assertEquals(expectedJsonString, stringified)
    }

    @Test
    fun testToJson() = runtime.evaluateInJSThreadBlocking {
        val json = format.decodeFromRuntimeValue(JsonElement.serializer(), expectedValue)
        Assertions.assertEquals(expectedJson, json)
    }

    @Test
    fun testToValue() = runtime.evaluateInJSThreadBlocking {
        val value = format.encodeToValue(expectedFlowResult)
        assertEquivalent(expectedObject, value.asObject(runtime))
    }

    @Test
    fun testFromValue() = runtime.evaluateInJSThreadBlocking {
        val flow = format.decodeFromRuntimeValue(FlowResult.serializer(), expectedValue)
        Assertions.assertEquals(expectedFlowResult, flow)
    }

    @Test
    fun testToAndFromValue() = runtime.evaluateInJSThreadBlocking {
        val value = format.encodeToValue(expectedFlowResult)
        assertEquivalent(expectedObject, value.asObject(runtime))

        val flow = format.decodeFromRuntimeValue(FlowResult.serializer(), value)
        Assertions.assertEquals(expectedFlowResult, flow)
    }
}
