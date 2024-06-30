package com.intuit.playerui.core.bridge.runtime

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.serialization.format.RuntimeFormat
import com.intuit.playerui.core.bridge.serialization.format.encodeToRuntimeValue
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.utils.InternalPlayerApi
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationStrategy

/** Special [Node] that represents the JS runtime */
public interface Runtime<Value> : Node {

    public val dispatcher: CoroutineDispatcher

    public val config: PlayerRuntimeConfig

    /** [CoroutineScope] that represents when the [Runtime] is released and relevant coroutines should cancel */
    public val scope: CoroutineScope

    override val format: RuntimeFormat<Value>

    @ExperimentalPlayerApi
    public fun executeRaw(script: String): Value =
        throw UnsupportedOperationException("This experimental method is not implemented for ${this::class.simpleName}")

    /** Execute some arbitrary [script] and return the deserialized result */
    public fun execute(script: String): Any?

    public fun load(scriptContext: ScriptContext): Any?

    /** Serialize and assign some [value] to [name] within the [Runtime] */
    public fun add(name: String, value: Value)

    /**
     * Serialize some [value] into the [Runtime] memory using the [serializer] and return
     * a JVM representation of the runtime object (i.e. serializing a map will return a [Node].
     */
    // TODO: This potentially should return [Value] but we need an avenue for decoding then encoding
    public fun <T> serialize(serializer: SerializationStrategy<T>, value: T): Any?

    /** Close the [Runtime] and release any resources */
    public fun release()

    /** Opportunity to verify the thread to perfom blocking operations on */
    @InternalPlayerApi
    public var checkBlockingThread: Thread.() -> Unit
}

public inline fun <reified T, Value> Runtime<Value>.add(name: String, value: T): Unit =
    add(name, format.encodeToRuntimeValue(value))

/** Helper method to [serialize] the [value] with the [KSerializer] found within the [serializersModule] */
public inline fun <reified T> Runtime<*>.serialize(value: T): Any? =
    serialize(format.serializer(), value)

public inline fun <reified T> Runtime<*>.serialize(serializer: SerializationStrategy<T>?, value: T): Any? = serializer?.let {
    serialize(it, value)
} ?: serialize(value)

public data class ScriptContext(
    val script: String,
    val id: String,
)
