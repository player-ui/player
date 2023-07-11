package com.intuit.player.jvm.core.flow

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull

/** Structure shaping the JSON payload the player expects */
@Serializable
public data class Flow(
    val id: String = UNKNOWN_ID,
    val views: List<JsonElement>? = emptyList(),
    val schema: JsonElement = JsonNull,
    val data: JsonElement = JsonNull,
    val navigation: Navigation? = null
) {

    public companion object {
        public const val UNKNOWN_ID: String = "unknown-id"
    }
}
