package com.intuit.playerui.android.utils

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement

public fun JsonElement.stringify() = Json.encodeToString(JsonElement.serializer(), this)
