package com.intuit.player.jvm.utils

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject

internal val JsonElement.safeJsonObject: JsonObject? get() = try { jsonObject } catch (e: IllegalArgumentException) { null }
internal val JsonElement.safeJsonArray: JsonArray? get() = try { jsonArray } catch (e: IllegalArgumentException) { null }
internal fun JsonElement.stringify() = Json.encodeToString(JsonElement.serializer(), this)

/** Recursively filter out all [keysToFilter] in each [JsonObject] of [this] tree */
public fun JsonObject.filterKeys(vararg keysToFilter: String): JsonObject = keys
    .filterNot { it in keysToFilter }
    .map { key ->
        key to when (val value = this[key]) {
            is JsonObject -> value.filterKeys(*keysToFilter)
            is JsonArray -> value.map { item ->
                (item as? JsonObject)?.filterKeys(*keysToFilter) ?: item
            }.let(::JsonArray)
            null -> JsonNull
            else -> value
        }
    }
    .toMap()
    .let(::JsonObject)

/** Recursively filter out all [keysToFilter] in each [Map] of [this] tree */
public fun Map<*, *>.filterKeys(vararg keysToFilter: String): Map<*, *> = keys
    .filterNot { it in keysToFilter }.associateWith { key ->
        when (val value = this[key]) {
            is Map<*, *> -> value.filterKeys(*keysToFilter)
            is List<*> -> value.map { item ->
                (item as? Map<*, *>)?.filterKeys(*keysToFilter) ?: item
            }
            else -> value
        }
    }
