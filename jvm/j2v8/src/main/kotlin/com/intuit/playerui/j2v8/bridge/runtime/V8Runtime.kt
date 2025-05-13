package com.intuit.playerui.j2v8.bridge.runtime

import com.eclipsesource.v8.V8
import com.eclipsesource.v8.V8Array
import com.eclipsesource.v8.V8Function
import com.eclipsesource.v8.V8Object
import com.eclipsesource.v8.V8Value
import com.eclipsesource.v8.utils.MemoryManager
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeConfig
import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeContainer
import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeFactory
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.serialization.serializers.playerSerializersModule
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.utils.InternalPlayerApi
import com.intuit.playerui.j2v8.V8Null
import com.intuit.playerui.j2v8.V8Primitive
import com.intuit.playerui.j2v8.V8Value
import com.intuit.playerui.j2v8.addPrimitive
import com.intuit.playerui.j2v8.bridge.V8Node
import com.intuit.playerui.j2v8.bridge.serialization.format.J2V8Format
import com.intuit.playerui.j2v8.bridge.serialization.format.J2V8FormatConfiguration
import com.intuit.playerui.j2v8.bridge.serialization.serializers.V8ValueSerializer
import com.intuit.playerui.j2v8.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.j2v8.extensions.handleValue
import com.intuit.playerui.j2v8.extensions.unlock
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExecutorCoroutineDispatcher
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.plus
import java.nio.file.Path
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.io.path.createTempDirectory
import kotlin.io.path.pathString

@JvmOverloads
public fun Runtime(runtime: V8, config: J2V8RuntimeConfig = J2V8RuntimeConfig(runtime)): Runtime<V8Value> =
    V8Runtime(config)

public fun Runtime(globalAlias: String? = null, tempDir: Path? = null): Runtime<V8Value> =
    Runtime(V8.createV8Runtime(globalAlias, tempDir?.pathString).unlock())

// TODO: Do a better job of exposing runtime args as Config params to limit the need for these
@JvmOverloads
public fun Runtime(globalAlias: String? = null, tempDirPrefix: String? = null): Runtime<V8Value> =
    Runtime(globalAlias, tempDirPrefix?.let(::createTempDirectory))

internal class V8Runtime(override val config: J2V8RuntimeConfig) : Runtime<V8Value> {

    lateinit var v8: V8; private set

    override val dispatcher: ExecutorCoroutineDispatcher = config.executorService.asCoroutineDispatcher()

    override val format: J2V8Format = J2V8Format(
        J2V8FormatConfiguration(
            this,
            playerSerializersModule + SerializersModule {
                contextual(V8Value::class, V8ValueSerializer)
                contextual(V8Function::class, V8ValueSerializer.conform())
                contextual(V8Object::class, V8ValueSerializer.conform())
                contextual(V8Array::class, V8ValueSerializer.conform())
                contextual(V8Primitive::class, V8ValueSerializer.conform())
                contextual(V8Null::class, V8ValueSerializer.conform())
            },
        ),
    )

    private lateinit var memoryScope: MemoryManager; private set

    override val scope: CoroutineScope by lazy {
        // explicitly not using the JS specific dispatcher to avoid clogging up that thread
        CoroutineScope(Dispatchers.Default + SupervisorJob() + (config.coroutineExceptionHandler ?: EmptyCoroutineContext))
    }

    init {
        // TODO: Uplevel suspension init towards creation point instead of runBlocking
        runBlocking {
            init()
        }
    }

    // Call to initialize V8 -- needs to be invoked for V8 to be set, will acquire the lock for pre-created V8s on the
    // single threaded executor (will fail if another thread has the lock). Otherwise, create a new V8 runtime
    suspend fun init() {
        withContext(dispatcher) {
            v8 = config.runtime?.apply {
                locker.acquire()
            } ?: V8.createV8Runtime()
            memoryScope = MemoryManager(v8)
        }
    }

    override fun executeRaw(script: String): V8Value = v8.evaluateInJSThreadBlocking(runtime) {
        V8Value(executeScript(script))
    }

    override fun execute(script: String): Any? = v8.evaluateInJSThreadBlocking(runtime) {
        executeScript(script).handleValue(format)
    }

    override fun load(scriptContext: ScriptContext): Unit = v8.evaluateInJSThreadBlocking(runtime) {
        if (config.debuggable) {
            scriptIds.add(scriptContext.id)
            scriptMapping[scriptContext.id] = scriptContext.script
        }
        executeScript(scriptContext.script, scriptContext.id.takeIf { config.debuggable }, 0)
    }

    override fun add(name: String, value: V8Value) {
        v8.evaluateInJSThreadBlocking(runtime) {
            when (value) {
                is V8Primitive -> addPrimitive(name, value)
                else -> add(name, value)
            }
        }
    }

    override fun <T> serialize(serializer: SerializationStrategy<T>, value: T): Any? = v8.evaluateInJSThreadBlocking(runtime) {
        format.encodeToRuntimeValue(serializer, value).handleValue(format)
    }

    override fun release() {
        if (isReleased()) return

        // cancel work in runtime scope
        scope.cancel("releasing runtime")
        // swap to dispatcher to release everything
        runBlocking(dispatcher) {
            memoryScope.release()
            v8.release(true)
        }
        // close dispatcher
        dispatcher.close()
    }

    @InternalPlayerApi
    override var checkBlockingThread: Thread.() -> Unit = {}

    private val scriptMapping = mutableMapOf<String, String>()

    private val scriptIds: MutableSet<String> = mutableSetOf()

    override fun toString(): String = "J2V8"

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
    override fun <R> getInvokable(key: String, deserializationStrategy: DeserializationStrategy<R>): Invokable<R>? = backingNode.getInvokable(key, deserializationStrategy)
    override fun <R> getFunction(key: String): Invokable<R>? = backingNode.getFunction(key)
    override fun getList(key: String): List<*>? = backingNode.getList(key)
    override fun getObject(key: String): Node? = backingNode.getObject(key)
}

public object J2V8 : PlayerRuntimeFactory<J2V8RuntimeConfig> {
    override fun create(block: J2V8RuntimeConfig.() -> Unit): Runtime<V8Value> =
        V8Runtime(J2V8RuntimeConfig().apply(block))

    override fun toString(): String = name
    public const val name: String = "J2V8"
}

public data class J2V8RuntimeConfig(
    var runtime: V8? = null,
    private val explicitExecutorService: ExecutorService? = null,
) : PlayerRuntimeConfig() {
    public val executorService: ExecutorService by lazy {
        explicitExecutorService ?: Executors.newSingleThreadExecutor {
            Executors.defaultThreadFactory().newThread(it).apply {
                name = "js-runtime"
            }
        }
    }
}

public class J2V8RuntimeContainer : PlayerRuntimeContainer {
    override val factory: PlayerRuntimeFactory<*> = J2V8

    override fun toString(): String = "J2V8"
}
