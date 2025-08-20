package com.intuit.playerui.utils

import com.intuit.playerui.utils.test.RuntimeTest
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate

class MakeFlowTests : RuntimeTest() {
    @TestTemplate fun `can make flow`() {
        MakeFlowModule.apply(runtime)

        val flow = makeFlow(
            buildJsonObject {
                put("id", "some-id")
                put("type", "some-type")
            },
        )

        assertTrue(flow is JsonObject)
        val keys = flow.jsonObject.keys
        assertEquals(
            setOf(
                "id",
                "views",
                "data",
                "navigation",
            ),
            keys,
        )
    }
}
