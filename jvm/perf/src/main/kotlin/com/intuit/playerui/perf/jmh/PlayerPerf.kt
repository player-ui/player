package com.intuit.playerui.perf.jmh

import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeConfig
import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeFactory
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.runtimeContainers
import com.intuit.playerui.core.player.HeadlessPlayer
import com.intuit.playerui.hermes.bridge.runtime.Hermes
import com.intuit.playerui.j2v8.bridge.runtime.J2V8
import kotlinx.coroutines.async
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.Contextual
import org.openjdk.jmh.annotations.Benchmark
import org.openjdk.jmh.annotations.BenchmarkMode
import org.openjdk.jmh.annotations.CompilerControl
import org.openjdk.jmh.annotations.Level.Invocation
import org.openjdk.jmh.annotations.Mode
import org.openjdk.jmh.annotations.OutputTimeUnit
import org.openjdk.jmh.annotations.Param
import org.openjdk.jmh.annotations.Scope
import org.openjdk.jmh.annotations.Setup
import org.openjdk.jmh.annotations.State
import org.openjdk.jmh.infra.Blackhole
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine


@Serializable
data class Update(
    val binding: String,

    /** The new value to set */
    @Contextual
    val value: Any?
)

@Serializable
@JvmInline value class ContentID(val id: String) {
    override fun toString() = id
}

val mocks: Map<ContentID, Update> = mapOf(
    ContentID("one") to Update(
        "foo",
        "bar",
    ),
    ContentID("two") to Update(
        "foo",
        true,
    ),
    ContentID("three") to Update(
        "foo",
        3
    ),
    ContentID("mocks/info/info-modal-flow") to Update(
        "foo",
        3
    ),
)

private const val playerSourcePath = "core/player/dist/Player.native.js"

private val playerSource by lazy {
    readResource(playerSourcePath)
}

private val classLoader by lazy {
    object {}::class.java.classLoader
}

private fun readResource(path: String): String = classLoader.getResource(path)?.readText()
    ?: throw Exception("resource of path ($path) not found")


@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@State(Scope.Thread)
public abstract class RuntimePerformance {

    @Param(Hermes.name, J2V8.name)
    protected lateinit var runtimeName: String; private set

    private lateinit var factory: PlayerRuntimeFactory<*>

    protected lateinit var runtime: Runtime<*>; private set

    @Setup public fun setupRuntimeFactory() {
        factory = findRuntimeFactory(runtimeName)
    }

    protected fun setupRuntime(block: PlayerRuntimeConfig.() -> Unit = {}): Runtime<*> = factory.create(block).also {
        runtime = it
    }

    private fun findRuntimeFactory(runtimeName: String): PlayerRuntimeFactory<*> =
        runtimeContainers.single { "$it" == runtimeName }.factory
}

public open class BenchRuntimeCreation : RuntimePerformance() {

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark public fun createRuntime(consumer: Blackhole) {
        consumer.consume(setupRuntime())
        runtime.release()
    }

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark fun createHeadlessPlayer(consumer: Blackhole) {
        // measures runtime headless player creation + runtime creation
        // this doesn't technically work the same way it does when the
        // player usually is created, because it just pulls the first
        // runtime factory it can find. we use our setupRuntime method
        // to ensure we release the runtime.
        consumer.consume(HeadlessPlayer(explicitRuntime = setupRuntime()))
        // we always release the runtime to make sure jmh isn't waiting
        // for the runtime thread to be released
        runtime.release()
    }
}

public open class BenchPlayerCreation : RuntimePerformance() {

    // if we don't release the runtime on each bench, we wouldn't need to reload the runtime
    // on each invocation it might be useful to see how "warm" the runtime can actually get
    @Setup(Invocation) public fun setup() {
        // load up runtime and player source in setup to isolate benchmarks
        setupRuntime()
        playerSource
    }

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark public fun createJSPlayer(consumer: Blackhole) {
        consumer.consume(runtime.execute(playerSource))
        consumer.consume(runtime.execute("""(new Player.Player())"""))
        runtime.release()
    }

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark public fun createHeadlessPlayer(consumer: Blackhole) {
        // uses runtime created outside benchmark
        consumer.consume(HeadlessPlayer(explicitRuntime = runtime))
        runtime.release()
    }
}

public open class BenchPlayerFlow : RuntimePerformance() {

    @Param("mocks/info/info-modal-flow")
    public lateinit var content: String

    public lateinit var flow: String

    public lateinit var update: Update

    @Setup(Invocation)
    public fun setup() {
        flow = readResource("$content.json")
        update = mocks[ContentID(content)] ?: throw RuntimeException("update not defined for $content")
    }

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark
    fun firstViewUpdate(consumer: Blackhole) {
        val player = HeadlessPlayer(explicitRuntime = setupRuntime())
        val pending = player.scope.async {
            suspendCoroutine {
                player.hooks.viewController.tap { vc ->
                    vc?.hooks?.view?.tap { v ->
                        v?.hooks?.onUpdate?.tap { a ->
                            it.resume(a)
                        }
                    }
                }
                player.start(flow)
            }
        }
        runBlocking {
            pending.await()
        }
        runtime.release()
    }
}
