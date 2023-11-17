package com.intuit.player.jvm.graaljs.bridge.runtime

import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.runtime.PlayerRuntimeConfig
import com.intuit.player.jvm.core.bridge.runtime.PlayerRuntimeContainer
import com.intuit.player.jvm.core.bridge.runtime.PlayerRuntimeFactory
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.serialization.serializers.playerSerializersModule
import com.intuit.player.jvm.core.player.PlayerException
import com.intuit.player.jvm.graaljs.bridge.GraalNode
import com.intuit.player.jvm.graaljs.bridge.serialization.format.GraalFormat
import com.intuit.player.jvm.graaljs.bridge.serialization.format.GraalFormatConfiguration
import com.intuit.player.jvm.graaljs.bridge.serialization.serializers.GraalValueSerializer
import com.intuit.player.jvm.graaljs.extensions.blockingLock
import com.intuit.player.jvm.graaljs.extensions.handleValue
import com.intuit.player.jvm.graaljs.player.PlayerContextFactory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.plus
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.Value
import java.util.concurrent.locks.ReentrantLock

public fun Runtime(runtime: Context, config: GraalRuntimeConfig = GraalRuntimeConfig()): Runtime<Value> = GraalRuntime(config)

internal class GraalRuntime(
    private val config: GraalRuntimeConfig
) : Runtime<Value> {

    val context: Context by config::graalContext

    override val format: GraalFormat = GraalFormat(
        GraalFormatConfiguration(
            this,
            playerSerializersModule + SerializersModule {
                contextual(Value::class, GraalValueSerializer)
            }
        )
    )

    companion object {
        val Context.isReleased: Boolean
            get() = contextRuntimeMap[this]?.released
                ?: throw PlayerException("Graal Context is not associated with a runtime")
        val Context.undefined: Value
            get() = eval("js", "undefined")
        private val contextRuntimeMap: MutableMap<Context, GraalRuntime> = hashMapOf()
        val Context.runtime: GraalRuntime get() = contextRuntimeMap[this] as GraalRuntime
    }

    private var released: Boolean = false

    internal val lock: ReentrantLock = ReentrantLock()

    init {
        contextRuntimeMap[context] = this
    }

    override val scope: CoroutineScope by lazy {
        CoroutineScope(Dispatchers.Default + SupervisorJob())
    }

    override fun execute(script: String): Any? = context.blockingLock {
        context.eval("js", script).handleValue(format)
    }

    override fun add(name: String, value: Value) {
        context.blockingLock {
            getBindings("js").putMember(name, value)
        }
    }

    override fun <T> serialize(serializer: SerializationStrategy<T>, value: T): Any? = context.blockingLock {
        format.encodeToRuntimeValue(serializer, value).handleValue(format)
    }

    override fun release() {
        context.blockingLock {
            context.close(true)
            released = true
            scope.cancel()
        }
    }

    override fun toString(): String = "Graal"

    private val backingNode: Node = GraalNode(context.getBindings("js"), this)
    override val runtime: GraalRuntime = this
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
    override fun <R> getInvokable(key: String, deserializationStrategy: DeserializationStrategy<R>): Invokable<R>? = backingNode.getInvokable(key, deserializationStrategy)
    override fun <R> getFunction(key: String): Invokable<R>? = backingNode.getFunction(key)
    override fun getList(key: String): List<*>? = backingNode.getList(key)
    override fun getObject(key: String): Node? = backingNode.getObject(key)
}

public object GraalJS : PlayerRuntimeFactory<GraalRuntimeConfig> {
    override fun create(block: GraalRuntimeConfig.() -> Unit): Runtime<Value> =
        GraalRuntime(GraalRuntimeConfig().apply(block))

    override fun toString(): String = "Graal"
}

public data class GraalRuntimeConfig(
    var graalContext: Context = PlayerContextFactory.context
) : PlayerRuntimeConfig()

public class GraalRuntimeContainer : PlayerRuntimeContainer {
    override val factory: PlayerRuntimeFactory<*> = GraalJS

    override fun toString(): String = "Graal"
}
