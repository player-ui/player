package com.intuit.playerui.perf.jmh

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.Promise
import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeFactory
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.runtimeContainers
import com.intuit.playerui.core.data.DataController
import com.intuit.playerui.core.data.set
import com.intuit.playerui.core.player.HeadlessPlayer
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import org.openjdk.jmh.annotations.Benchmark
import org.openjdk.jmh.annotations.BenchmarkMode
import org.openjdk.jmh.annotations.CompilerControl
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
    )
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
@State(Scope.Benchmark)
abstract class RuntimePerformance {

    @Param("J2V8", "Graal")
    lateinit var runtime: String

    lateinit var factory: PlayerRuntimeFactory<*>

    protected fun findRuntimeFactory(runtime: String): PlayerRuntimeFactory<*> =
        runtimeContainers.single { "$it" == runtime }.factory

    protected fun setupRuntime(runtime: String = this.runtime) {
        factory = findRuntimeFactory(runtime)
    }
}

open class RuntimeCreation : RuntimePerformance() {

    @Setup fun setup() {
        setupRuntime()
    }

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark fun createRuntime(consumer: Blackhole) {
        consumer.consume(factory.create())
    }

}

open class RuntimePlayerCreation : RuntimePerformance() {

    lateinit var jsRuntime: Runtime<*>

    @Setup fun setup() {
        setupRuntime(runtime)
        jsRuntime = factory.create()
        playerSource
    }

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark fun createHeadlessPlayer(consumer: Blackhole) {
        consumer.consume(HeadlessPlayer(explicitRuntime = jsRuntime))
    }

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark fun createPlayer(consumer: Blackhole) {
        jsRuntime.execute(playerSource)
        consumer.consume(jsRuntime.execute("""(new Player.Player())"""))
    }

}

open class ContentPerformance : RuntimePerformance() {

    @Param("w2", "pi", "cli")
    lateinit var content: String

    lateinit var flow: String

    lateinit var update: Update

    lateinit var jsRuntime: Runtime<*>

    protected fun readContent(content: String): String =
        readResource("$content.json")

    protected fun setupContent(content: String = this.content) {
        setupRuntime()
        jsRuntime = factory.create()
        flow = readContent(content)
        update = mocks[ContentID(content)]!!
    }

}

open class HeadlessPlayerFlowPerformance : ContentPerformance() {

    lateinit var runtimeFactory: PlayerRuntimeFactory<*>

    @Setup fun setup() {
        setupContent()
    }

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark fun startFlow(consumer: Blackhole) {
        val player = HeadlessPlayer(explicitRuntime = jsRuntime)
        consumer.consume(runBlocking {
            suspendCoroutine<Asset?> {
                player.hooks.viewController.tap("perf") { vc ->
                    vc?.hooks?.view?.tap("new view") { v ->
                        v?.hooks?.onUpdate?.tap("test") { a ->
                            it.resume(a)
                        }
                    }
                }

                player.start(flow)
            }
        })
    }

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark fun startAndUpdateFlow(consumer: Blackhole) {
        val player = HeadlessPlayer(explicitRuntime = jsRuntime)
        consumer.consume(runBlocking {
            suspendCoroutine<Asset?> {
                var dataController: DataController? = null
                player.hooks.dataController.tap("perf") { dc ->
                    dataController = dc
                }

                var updateCount = 0
                player.hooks.viewController.tap("perf") { vc ->
                    vc?.hooks?.view?.tap("new view") { v ->
                        v?.hooks?.onUpdate?.tap("test") { a ->
                            if (updateCount++ == 0)
                                dataController!!.set(update.binding to update.value)

                            else it.resume(a)
                        }
                    }
                }

                player.start(flow)
            }
        })
    }

}

open class RuntimePlayerFlowPerformance : ContentPerformance() {

    lateinit var runtimeFactory: PlayerRuntimeFactory<*>

    lateinit var flowNode: Node

    @Setup fun setup() {
        setupContent()
        flowNode = jsRuntime.execute("""($flow)""") as Node
    }

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark fun startFlow(consumer: Blackhole) {
        jsRuntime.execute(playerSource)

        val runner = jsRuntime.execute("""
((content, playerFactory = () => new Player.Player()) => {
    return new Promise((resolve, reject) => {
        try {
            const player = playerFactory();
            player.hooks.viewController.tap("perf", (vc) => {
                vc.hooks.view.tap("new view", (v) => {
                    v.hooks.onUpdate.tap("test", (a) => {
                        resolve(a);
                    });
                });
            });
            player.start(content).catch(reject);
        } catch (e) { reject(e); }
    });
})
""") as Invokable<Node>
        val promise = Promise(runner(flowNode))

        consumer.consume(runBlocking {
            promise.toCompletable<Asset>(Asset.serializer()).await()
        })
    }

    @CompilerControl(CompilerControl.Mode.DONT_INLINE)
    @Benchmark fun startAndUpdateFlow(consumer: Blackhole) {
        jsRuntime.execute(playerSource)

        val runner = jsRuntime.execute("""
((content, update, playerFactory = () => new Player.Player()) => {
    return new Promise((resolve, reject) => {
        try {
            const player = playerFactory();
            let dataController;
            player.hooks.dataController.tap("perf", (dc) => {
                dataController = dc;
            });
            let updateCount = 0;
            player.hooks.viewController.tap("perf", (vc) => {
                vc.hooks.view.tap("new view", (v) => {
                    v.hooks.onUpdate.tap("test", (a) => {
                        if (updateCount++ == 0)
                            dataController.set({ [update.binding]: update.value });
                        else resolve(a);
                    });
                });
            });
            player.start(content).catch(reject);
        } catch (e) { reject(e); }
    });
})
""") as Invokable<Node>
        val promise = Promise(runner(flowNode, update))

        consumer.consume(runBlocking {
            promise.toCompletable<Asset>(Asset.serializer()).await()
        })
    }

}
