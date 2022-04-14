package com.intuit.player.jvm.j2v8.bridge.serialization.format

import com.eclipsesource.v8.V8
import com.eclipsesource.v8.V8Value
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.serialization.format.AbstractRuntimeFormat
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeFormatConfiguration
import com.intuit.player.jvm.core.bridge.serialization.format.serializer
import com.intuit.player.jvm.j2v8.V8Value
import com.intuit.player.jvm.j2v8.bridge.runtime.V8Runtime
import com.intuit.player.jvm.j2v8.bridge.serialization.encoding.readV8
import com.intuit.player.jvm.j2v8.bridge.serialization.encoding.writeV8
import com.intuit.player.jvm.j2v8.extensions.blockingLock
import kotlinx.serialization.*
import kotlinx.serialization.modules.SerializersModule

public class J2V8Format(
    config: J2V8FormatConfiguration,
) : AbstractRuntimeFormat<V8Value>(config) {

    public val v8: V8 = (config.runtime as V8Runtime).v8

    override fun <T> encodeToRuntimeValue(serializer: SerializationStrategy<T>, value: T): V8Value =
        writeV8(value, serializer)

    override fun <T> decodeFromRuntimeValue(deserializer: DeserializationStrategy<T>, element: V8Value): T =
        readV8(element, deserializer)

    public fun parseToV8Value(string: String): V8Value =
        parseToRuntimeValue(string)

    override fun parseToRuntimeValue(string: String): V8Value = v8.blockingLock {
        executeScript("($string)").let(::V8Value)
    }
}

public data class J2V8FormatConfiguration internal constructor(
    override val runtime: Runtime<V8Value>,
    override val serializersModule: SerializersModule,
) : RuntimeFormatConfiguration<V8Value>

internal inline fun <reified T> J2V8Format.encodeToV8Value(value: T): V8Value =
    encodeToRuntimeValue(serializer(), value)

internal inline fun <reified T> J2V8Format.decodeFromV8Value(value: V8Value): T =
    decodeFromRuntimeValue(serializer(), value)
