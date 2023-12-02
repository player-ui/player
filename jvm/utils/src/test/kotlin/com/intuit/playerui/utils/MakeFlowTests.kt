package com.intuit.playerui.utils

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class MakeFlowTests {

    @Test fun `can make flow`() {
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
