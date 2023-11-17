package com.intuit.player.jvm.core.bridge

import com.intuit.player.jvm.core.bridge.serialization.json.value
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull

internal fun isUndefined(value: Any?, recurse: (Any?) -> Boolean = { isUndefined(it) }): Boolean = when (value) {
    is Unit -> true
    is Node -> value.isUndefined()
    is JsonPrimitive -> when {
        // Check for unquoted undefined literal
        !value.isString -> value.contentOrNull == "undefined"
        // Check for quoted string descriptor
        value.isString -> recurse(value.value)
        else -> false
    }
    else -> false
}
