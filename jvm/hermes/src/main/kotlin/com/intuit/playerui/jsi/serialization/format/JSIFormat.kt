package com.intuit.playerui.jsi.serialization.format

import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.serialization.format.AbstractRuntimeFormat
import com.intuit.playerui.core.bridge.serialization.format.RuntimeFormatConfiguration
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.encoding.readFromValue
import com.intuit.playerui.jsi.serialization.encoding.writeToValue
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.modules.SerializersModule

public class JSIFormat(
    config: JSIFormatConfiguration,
) : AbstractRuntimeFormat<Value>(config) {

    // TODO: Do we need to cast?
    override val runtime: HermesRuntime by lazy {
        config.runtime as HermesRuntime
    }

    override fun <T> encodeToRuntimeValue(serializer: SerializationStrategy<T>, value: T): Value =
        writeToValue(value, serializer)

    override fun <T> decodeFromRuntimeValue(deserializer: DeserializationStrategy<T>, element: Value): T =
        readFromValue(element, deserializer)

    override fun parseToRuntimeValue(string: String): Value =
        runtime.executeRaw("($string)")
}

public data class JSIFormatConfiguration internal constructor(
    override val runtime: Runtime<Value>,
    override val serializersModule: SerializersModule,
) : RuntimeFormatConfiguration<Value>

internal inline fun <reified T> JSIFormat.encodeToValue(value: T): Value =
    encodeToRuntimeValue(serializer(), value)

internal inline fun <reified T> JSIFormat.decodeFromValue(value: Value): T =
    decodeFromRuntimeValue(serializer(), value)
