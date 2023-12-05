package com.intuit.player.jvm.graaljs.bridge.serialization.format

import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.serialization.format.AbstractRuntimeFormat
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeFormatConfiguration
import com.intuit.player.jvm.core.bridge.serialization.format.serializer
import com.intuit.player.jvm.graaljs.bridge.runtime.GraalRuntime
import com.intuit.player.jvm.graaljs.bridge.serialization.encoding.readValue
import com.intuit.player.jvm.graaljs.bridge.serialization.encoding.writeValue
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.modules.SerializersModule
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.Value

public class GraalFormat(
    config: GraalFormatConfiguration,
) : AbstractRuntimeFormat<Value>(config) {

    public val context: Context = (config.runtime as GraalRuntime).context

    override fun <T> encodeToRuntimeValue(serializer: SerializationStrategy<T>, value: T): Value =
        writeValue(value, serializer)

    override fun <T> decodeFromRuntimeValue(deserializer: DeserializationStrategy<T>, element: Value): T =
        readValue(element, deserializer)

    override fun parseToRuntimeValue(string: String): Value =
        context.eval("js", string)
}

public data class GraalFormatConfiguration internal constructor(
    override val runtime: Runtime<Value>,
    override val serializersModule: SerializersModule,
) : RuntimeFormatConfiguration<Value>

internal inline fun <reified T> GraalFormat.encodeToGraalValue(value: T): Value =
    encodeToRuntimeValue(serializer(), value)

internal inline fun <reified T> GraalFormat.decodeFromGraalValue(value: Value): T =
    decodeFromRuntimeValue(serializer(), value)
