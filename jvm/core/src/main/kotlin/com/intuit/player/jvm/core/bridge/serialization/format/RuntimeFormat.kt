package com.intuit.player.jvm.core.bridge.serialization.format

import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.serialization.json.PrettyJson
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.core.bridge.serialization.serializers.KCallableSerializer
import kotlinx.serialization.*
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.SerializersModuleBuilder
import kotlinx.serialization.modules.contextual
import kotlinx.serialization.modules.plus
import kotlin.reflect.KCallable
import kotlin.reflect.KClass
import kotlin.reflect.full.isSubclassOf

public interface RuntimeFormat<Value> : SerialFormat {
    public val runtime: Runtime<Value>

    public fun registerSerializersModule(serializersModule: SerializersModule)

    public fun <T> encodeToRuntimeValue(serializer: SerializationStrategy<T>, value: T): Value

    public fun <T> decodeFromRuntimeValue(deserializer: DeserializationStrategy<T>, element: Value): T

    public fun parseToRuntimeValue(string: String): Value
}

public abstract class AbstractRuntimeFormat<Value>(public val config: RuntimeFormatConfiguration<Value>) : RuntimeFormat<Value>, StringFormat {
    override val runtime: Runtime<Value> get() = config.runtime

    final override var serializersModule: SerializersModule = config.serializersModule; private set

    override fun registerSerializersModule(serializersModule: SerializersModule) {
        this.serializersModule += serializersModule
    }

    override fun <T> decodeFromString(deserializer: DeserializationStrategy<T>, string: String): T =
        this.decodeFromRuntimeValue(deserializer, parseToRuntimeValue(string))

    override fun <T> encodeToString(serializer: SerializationStrategy<T>, value: T): String =
        PrettyJson.encodeToString(serializer, value)
}

public fun RuntimeFormat<*>.registerSerializersModule(block: SerializersModuleBuilder.() -> Unit) {
    SerializersModule {
        block()
    }.also(::registerSerializersModule)
}

public inline fun <reified T : Any> RuntimeFormat<*>.registerContextualSerializer(serializer: KSerializer<T>): Unit = registerSerializersModule {
    contextual(serializer)
}

public fun <T : Any> RuntimeFormat<*>.registerContextualSerializer(klass: KClass<T>, serializer: KSerializer<T>): Unit = registerSerializersModule {
    contextual(klass, serializer)
}

/** [RuntimeFormat] specific [KSerializer] lookup for [T] type that handles special cases before delegating to the [serializersModule] */
public inline fun <reified T> RuntimeFormat<*>.serializer(): KSerializer<T> = when {
    T::class == Any::class -> GenericSerializer().conform()
    T::class.isSubclassOf(KCallable::class) -> KCallableSerializer<Any?>() as KSerializer<T>
    else -> serializersModule.serializer()
}

public inline fun <reified T, Value> RuntimeFormat<Value>.encodeToRuntimeValue(value: T): Value =
    encodeToRuntimeValue(serializer(), value)

public inline fun <reified T, Value> RuntimeFormat<Value>.decodeFromRuntimeValue(value: Value): T =
    decodeFromRuntimeValue(serializer(), value)

public interface RuntimeFormatConfiguration<Value> {

    public val runtime: Runtime<Value>

    public val serializersModule: SerializersModule
}
