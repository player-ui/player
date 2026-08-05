package com.intuit.playerui.utils.test

import com.intuit.playerui.core.flow.Navigation
import com.intuit.playerui.core.utils.InternalPlayerApi
import com.intuit.playerui.utils.mocks.ClassLoaderMock
import com.intuit.playerui.utils.mocks.ClassLoaderMocksReader
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull

public val ClassLoaderMocksReader.simpleMock: ClassLoaderMock
    get() = findMockByName("collection-basic") ?: throw PlayerTestException("Could not find mock by name: collection-basic")

public val mocks: ClassLoaderMocksReader by lazy {
    ClassLoaderMocksReader()
}

public val simpleFlowString: String by lazy {
    mocks.simpleMock.getFlow()
}

@OptIn(InternalPlayerApi::class)
public val simpleFlow: Flow by lazy {
    Json { ignoreUnknownKeys = true }
        .decodeFromString(Flow.serializer(), simpleFlowString)
}

public val counterFlowString: String =
    """
    {
      "id": "counter-flow",
      "views": [
        { "id": "view-1", "type": "text", "value": "{{count}}" }
      ],
      "data": { "count": 0 },
      "navigation": {
        "BEGIN": "FLOW_1",
        "FLOW_1": {
          "startState": "VIEW_1",
          "VIEW_1": {
            "state_type": "VIEW",
            "ref": "view-1",
            "transitions": { "*": "END_Done" }
          },
          "END_Done": { "state_type": "END", "outcome": "done" }
        }
      }
    }
    """.trimIndent()

@InternalPlayerApi
@Serializable
public data class Flow(
    val id: String = "unknown-id",
    val views: List<JsonElement>? = emptyList(),
    val schema: JsonElement = JsonNull,
    val data: JsonElement = JsonNull,
    val navigation: Navigation? = null,
)
