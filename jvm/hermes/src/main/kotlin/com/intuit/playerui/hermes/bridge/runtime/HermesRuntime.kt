package com.intuit.playerui.hermes.bridge.runtime

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.facebook.soloader.nativeloader.NativeLoader
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeConfig
import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeContainer
import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeFactory
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.serialization.serializers.playerSerializersModule
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.utils.InternalPlayerApi
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime.Config
import com.intuit.playerui.hermes.extensions.handleValue
import com.intuit.playerui.hermes.extensions.toNode
import com.intuit.playerui.jni.ResourceLoaderDelegate
import com.intuit.playerui.jsi.Array
import com.intuit.playerui.jsi.Function
import com.intuit.playerui.jsi.JSIValueContainer
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Symbol
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.Value.Companion.createFromJson
import com.intuit.playerui.jsi.serialization.format.JSIFormat
import com.intuit.playerui.jsi.serialization.format.JSIFormatConfiguration
import com.intuit.playerui.jsi.serialization.serializers.JSIValueContainerSerializer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExecutorCoroutineDispatcher
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.plus
import java.util.concurrent.Executors
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.system.exitProcess
import com.intuit.playerui.jsi.Runtime as JSIRuntime


// TODO: Likely split up JNI & Runtime impl
public class HermesRuntime private constructor(mHybridData: HybridData) : Runtime<Value>, JSIRuntime(mHybridData) {

    public companion object {
        init {
            if (!NativeLoader.isInitialized()) NativeLoader.init(ResourceLoaderDelegate())
            // need to load fbjni -> jsi|hermes -> hermes_jni
            NativeLoader.loadLibrary("fbjni")
            NativeLoader.loadLibrary("jsi")
            NativeLoader.loadLibrary("hermes")
            NativeLoader.loadLibrary("hermes_jni")
        }

        @JvmStatic public external fun create(): HermesRuntime
        @JvmStatic public external fun create(runtimeConfig: Config): HermesRuntime

        public operator fun invoke(): HermesRuntime = create()
        public operator fun invoke(runtimeConfig: Config): HermesRuntime = create(runtimeConfig)
    }

    override val config: Config external get

    override val dispatcher: ExecutorCoroutineDispatcher = Executors.newSingleThreadExecutor {
        Executors.defaultThreadFactory().newThread(it).apply {
            name = "hermes-runtime"
        }
    }.asCoroutineDispatcher()

    override val format: JSIFormat = JSIFormat(
        JSIFormatConfiguration(
        this,
        playerSerializersModule + SerializersModule {
            // TODO: Do we get this all for free with a sealed class?
            contextual(JSIValueContainer::class, JSIValueContainerSerializer)
            contextual(Value::class, JSIValueContainerSerializer.conform())
            contextual(Object::class, JSIValueContainerSerializer.conform())
            contextual(Array::class, JSIValueContainerSerializer.conform())
            contextual(Function::class, JSIValueContainerSerializer.conform())
            contextual(Symbol::class, JSIValueContainerSerializer.conform())
        },
    ),)

    override val scope: CoroutineScope by lazy {
        // explicitly not using the JS specific dispatcher to avoid clogging up that thread
        CoroutineScope(Dispatchers.Default + SupervisorJob() + (config.coroutineExceptionHandler ?: EmptyCoroutineContext))
    }

    @OptIn(ExperimentalPlayerApi::class)
    override fun executeRaw(script: String): Value = evaluateJavaScript(script)

    override fun execute(script: String): Any? = executeRaw(script).handleValue(format)

    // TODO: Add debuggable sources if necessary, tho we'd likely go towards HBC anyways
    override fun load(scriptContext: ScriptContext): Any? = execute(scriptContext.script)

    override fun add(name: String, value: Value) {
        global().setProperty(runtime, name, value)
    }

    override fun <T> serialize(serializer: SerializationStrategy<T>, value: T): Any? =
        format.encodeToRuntimeValue(serializer, value).handleValue(format)

    override fun release() {
        // cancel work in runtime scope
        scope.cancel("releasing runtime")
        // swap to dispatcher to release everything
        runBlocking(dispatcher) {
            // TODO: Release scopes & runtime
        }
        // close dispatcher
        dispatcher.close()
    }

    @InternalPlayerApi
    override var checkBlockingThread: Thread.() -> Unit = {}

    override fun toString(): String = "HermesRuntime"

    // Delegated Node members
    private val backingNode: Node = global().toNode(format)

    override val runtime: HermesRuntime = this
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

    public class Config private constructor(@DoNotStrip private val mHybridData: HybridData) : PlayerRuntimeConfig() {
        public companion object {
            @JvmStatic public external fun create(
                intl: Boolean,
                microtaskQueue: Boolean,
            ): Config

            // Pulling defaults from JSI RuntimeConfig defaults
            public operator fun invoke(
                intl: Boolean = true,
                microtaskQueue: Boolean = false,
            ): Config = create(intl, microtaskQueue)
        }
    }
}

public object Hermes : PlayerRuntimeFactory<Config> {
    override fun create(block: Config.() -> Unit): HermesRuntime =
        HermesRuntime.create(Config.invoke())

    override fun toString(): String = "Hermes"
}

public class HermesRuntimeContainer : PlayerRuntimeContainer {
    override val factory: Hermes = Hermes
    override fun toString(): String = "Hermes"
}

// TODO: Remove - just a POC testbed to be able to get native crash logs easier
public fun main() {
    try {
        NativeLoader.init(ResourceLoaderDelegate())
        println("Trying to execute 2 + 2")
        val runtime = HermesRuntime()
        println("Runtime: $runtime")
        val four = runtime.evaluateJavaScript("2 + 2")
        four.asNumber().let(::println)

        runBlocking(Dispatchers.Default) {
            val result = runtime.evaluateJavaScript("20 + 20")
            result.asNumber().let(::println)
            result.let(::println)
            result.toString(runtime).let(::println)
        }

        val json = createFromJson(runtime, buildJsonObject { put("hello", "world") })
        json.isObject().let(::println)
        json.asObject(runtime).let(::println)
        json.asObject(runtime).getProperty(runtime, "hello").toString(runtime).let(::println)

        val func = runtime.evaluateJavaScript("((i) => 3 + i)")
        func.isObject().let(::println)
        func.asObject(runtime).isFunction(runtime).let(::println)
        val funcRes = func.asObject(runtime).asFunction(runtime).call(runtime, Value.from(3))
        funcRes.let(::println)
        funcRes.toString(runtime).let(::println)

        val symbol = runtime.evaluateJavaScript("Symbol.for('hello-world')")
        symbol.isSymbol().let(::println)
        symbol.asSymbol(runtime).toString(runtime).let(::println)

        val r2 = HermesRuntime(Config(false))
        r2.global().getProperty(r2, "Intl").toString(r2).let(::println)
        val r3 = HermesRuntime(Config(true))
        r3.global().getProperty(r3, "Intl").toString(r3).let(::println)
        r3.global().getProperty(r3, "Intl").toString(r2).let(::println)
    } catch (t: Throwable) {
        t.printStackTrace()
        exitProcess(1)
    }
    exitProcess(0)
}
