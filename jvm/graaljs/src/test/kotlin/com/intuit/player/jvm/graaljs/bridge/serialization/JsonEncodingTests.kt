package com.intuit.player.jvm.graaljs.bridge.serialization

import com.intuit.player.jvm.core.flow.FlowResult
import com.intuit.player.jvm.graaljs.base.GraalTest
import com.intuit.player.jvm.graaljs.bridge.GraalNode
import com.intuit.player.jvm.graaljs.bridge.serialization.format.encodeToGraalValue
import com.intuit.player.jvm.graaljs.extensions.blockingLock
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class JsonEncodingTests : GraalTest() {
    private val expectedJson = buildJsonObject {
        put("data", buildJsonObject { put("a", "b") })
        put(
            "endState",
            buildJsonObject {
                put("state_type", "END")
                put("outcome", "doneWithTopic")
            }
        )
    }
    private val expectedJsonString = expectedJson.toString()
    private val graalObject = format.context.blockingLock {
        eval("js", """($expectedJsonString)""")
    }
    private val expectedFlowResult = FlowResult(GraalNode(graalObject, runtime))

    @Test
    fun testStringify() {
        val stringified = Json.encodeToString(expectedFlowResult)
        Assertions.assertEquals(expectedJsonString, stringified)
    }

    @Test
    fun testToJson() {
        val json = format.decodeFromRuntimeValue(JsonElement.serializer(), graalObject)
        Assertions.assertEquals(expectedJson, json)
    }

    @Test
    fun testToGraal() {
        graalObject.assertEquivalent(format.encodeToGraalValue(expectedFlowResult))
    }

    @Test
    fun testFromGraal() {
        val flow = format.decodeFromRuntimeValue(FlowResult.serializer(), graalObject)
        Assertions.assertEquals(expectedFlowResult, flow)
    }

    @Test
    fun testToAndFromGraal() {
        val graalObject = format.encodeToGraalValue(expectedFlowResult)
        this.graalObject.assertEquivalent(graalObject)

        val flow = format.decodeFromRuntimeValue(FlowResult.serializer(), graalObject)
        Assertions.assertEquals(expectedFlowResult, flow)
    }
}
