package com.intuit.player.jvm.core.bridge.serialization.json

import com.intuit.player.jvm.core.utils.InternalPlayerApi
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.longOrNull

/**
 * [JsonPrimitive] extension property to help get the backing value
 *
 * [JsonPrimitive.value] should do this, but was having issues
 * with types being returned as a string regardless of the actual type
 */
@InternalPlayerApi
public val JsonPrimitive.value: Any get() = if (isString) {
    content
} else { null }
    ?: longOrNull
    ?: doubleOrNull
    ?: booleanOrNull
    ?: content

@InternalPlayerApi
public val SerializationStrategy<*>.isJsonElementSerializer: Boolean get() = descriptor
    .isJsonElementDescriptor

@InternalPlayerApi
public val DeserializationStrategy<*>.isJsonElementSerializer: Boolean get() = descriptor
    .isJsonElementDescriptor

@InternalPlayerApi
public val KSerializer<*>.isJsonElementSerializer: Boolean get() = descriptor
    .isJsonElementDescriptor

@InternalPlayerApi
public val SerialDescriptor.isJsonElementDescriptor: Boolean get() = serialName
    .contains("kotlinx.serialization.json.Json")
