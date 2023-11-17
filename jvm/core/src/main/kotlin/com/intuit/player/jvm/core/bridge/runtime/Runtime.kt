package com.intuit.player.jvm.core.bridge.runtime

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeFormat
import com.intuit.player.jvm.core.bridge.serialization.format.encodeToRuntimeValue
import com.intuit.player.jvm.core.bridge.serialization.format.serializer
import com.intuit.player.jvm.core.utils.InternalPlayerApi
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationStrategy

/** Special [Node] that represents the JS runtime */
public interface Runtime<Value> : Node {

    public val dispatcher: CoroutineDispatcher

    /** [CoroutineScope] that represents when the [Runtime] is released and relevant coroutines should cancel */
    public val scope: CoroutineScope

    override val format: RuntimeFormat<Value>

    /** Execute some arbitrary [script] and return the deserialized result */
    public fun execute(script: String): Any?

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
