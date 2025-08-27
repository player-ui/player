package com.intuit.playerui.android.utils

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement

internal fun JsonElement.stringify() = Json.encodeToString(JsonElement.serializer(), this)
