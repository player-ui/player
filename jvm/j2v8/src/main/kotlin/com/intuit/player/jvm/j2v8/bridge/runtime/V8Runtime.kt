package com.intuit.player.jvm.j2v8.bridge.runtime

import com.eclipsesource.v8.V8
import com.eclipsesource.v8.V8Array
import com.eclipsesource.v8.V8Object
import com.eclipsesource.v8.V8Value
import com.eclipsesource.v8.utils.MemoryManager
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.runtime.*
import com.intuit.player.jvm.core.bridge.serialization.serializers.playerSerializersModule
import com.intuit.player.jvm.j2v8.V8Primitive
import com.intuit.player.jvm.j2v8.addPrimitive
import com.intuit.player.jvm.j2v8.bridge.V8Node
import com.intuit.player.jvm.j2v8.bridge.serialization.format.J2V8Format
import com.intuit.player.jvm.j2v8.bridge.serialization.format.J2V8FormatConfiguration
import com.intuit.player.jvm.j2v8.bridge.serialization.serializers.V8ValueSerializer
import com.intuit.player.jvm.j2v8.extensions.blockingLock
import com.intuit.player.jvm.j2v8.extensions.handleValue
import com.intuit.player.jvm.j2v8.extensions.unlock
import kotlinx.coroutines.*
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.plus

public fun Runtime(runtime: V8, config: J2V8RuntimeConfig = J2V8RuntimeConfig(runtime)): Runtime<V8Value> =
    V8Runtime(config)

internal class V8Runtime(private val config: J2V8RuntimeConfig) : Runtime<V8Value> {

    val v8: V8 by config::runtime

    override val format: J2V8Format = J2V8Format(
        J2V8FormatConfiguration(
            this,
            playerSerializersModule + SerializersModule {
                contextual(V8Value::class, V8ValueSerializer)
                contextual(V8Object::class, V8ValueSerializer.conform())
                contextual(V8Array::class, V8ValueSerializer.conform())
                contextual(V8Primitive::class, V8ValueSerializer.conform())
            }
        )
    )

    private val memoryScope: MemoryManager = MemoryManager(config.runtime)

    override val scope: CoroutineScope by lazy {
        CoroutineScope(Dispatchers.Default + SupervisorJob())
    }

    override fun execute(script: String): Any? = v8.blockingLock {
        executeScript(script).handleValue(format)
    }

    override fun add(name: String, value: V8Value) {
        v8.blockingLock {
            when (value) {
                is V8Primitive -> addPrimitive(name, value)
                else -> add(name, value)
            }
        }
    }

    override fun <T> serialize(serializer: SerializationStrategy<T>, value: T): Any? = v8.blockingLock {
        format.encodeToRuntimeValue(serializer, value).handleValue(format)
    }

    override fun release() {
        v8.blockingLock {
            scope.cancel()
            memoryScope.release()
            runtime.release(true)
        }
    }

    override fun toString() = "J2V8"

    // Delegated Node members
    private val backingNode: Node = V8Node(v8, this)

    override val runtime: V8Runtime = this
    override val entries: Set<Map.Entry<String, Any?>> by backingNode::entries
    override val keys: Set<String> by backingNode::keys
    override val size: Int by backingNode::size
    override val values: Collection<Any?> by backingNode::values
    override fun containsKey(key: String): Boolean = backingNode.containsKey(key)
    override fun containsValue(value: Any?): Boolean = backingNode.containsValue(value)
    override fun get(key: String): Any? = backingNode[key]
    override fun isEmpty(): Boolean = backingNode.isEmpty()
    override fun <T> getSerializable(key: String, deserializer: DeserializationStrategy<T>): T? =
        backingNode.getSerializable(key, deserializer)
    override fun <T> deserialize(deserializer: DeserializationStrategy<T>): T = backingNode.deserialize(deserializer)
    override fun isReleased(): Boolean = backingNode.isReleased()
    override fun isUndefined(): Boolean = backingNode.isUndefined()
    override fun nativeReferenceEquals(other: Any?): Boolean = backingNode.nativeReferenceEquals(other)
    override fun getString(key: String): String? = backingNode.getString(key)
    override fun getInt(key: String): Int? = backingNode.getInt(key)
    override fun getDouble(key: String): Double? = backingNode.getDouble(key)
    override fun getLong(key: String): Long? = backingNode.getLong(key)
    override fun getBoolean(key: String): Boolean? = backingNode.getBoolean(key)
    override fun <R> getFunction(key: String): Invokable<R>? = backingNode.getFunction(key)
    override fun getList(key: String): List<*>? = backingNode.getList(key)
    override fun getObject(key: String): Node? = backingNode.getObject(key)
}

public object J2V8 : PlayerRuntimeFactory<J2V8RuntimeConfig> {
    override fun create(block: J2V8RuntimeConfig.() -> Unit): Runtime<V8Value> =
        V8Runtime(J2V8RuntimeConfig().apply(block))

    override fun toString(): String = "J2V8"
}

public data class J2V8RuntimeConfig(
    var runtime: V8 = V8.createV8Runtime().unlock(),
) : PlayerRuntimeConfig()

public class J2V8RuntimeContainer : PlayerRuntimeContainer {
    override val factory: PlayerRuntimeFactory<*> = J2V8

    override fun toString(): String = "J2V8"
}
