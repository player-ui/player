package com.intuit.player.jvm.core.player

import com.intuit.player.jvm.core.bridge.Completable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.runtime.add
import com.intuit.player.jvm.core.bridge.runtime.runtimeFactory
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField.Companion.NodeSerializableField
import com.intuit.player.jvm.core.logger.TapableLogger
import com.intuit.player.jvm.core.player.HeadlessPlayer.Companion.bundledSource
import com.intuit.player.jvm.core.player.state.CompletedState
import com.intuit.player.jvm.core.player.state.PlayerFlowState
import com.intuit.player.jvm.core.player.state.ReleasedState
import com.intuit.player.jvm.core.plugins.*
import com.intuit.player.jvm.core.plugins.logging.loggers
import java.net.URL

/**
 * Headless [Player] wrapping a core JS player with a [Runtime]. The [player] will
 * be instantiated from the [bundledSource] unless supplied with
 * a different [source] to read from.
 *
 * Though this accepts a collection of generic [Plugin]s, this
 * will only [Plugin.apply] [plugins] that are known and appropriate
 * for this context. Additionally, certain plugins will be filtered
 * and applied in a specific order that guarantees safety.
 *
 * Allowed [Plugin]s:
 *  - [RuntimePlugin]
 *  - [JSPluginWrapper]
 *  - [PlayerPlugin]
 */
public class HeadlessPlayer public constructor(
    override val plugins: List<Plugin>,
    public val runtime: Runtime<*> = runtimeFactory.create(),
    private val source: URL = bundledSource,
) : Player(), NodeWrapper {

    /** Convenience constructor to allow [plugins] to be passed as varargs */
    @JvmOverloads public constructor(
        vararg plugins: Plugin,
        runtime: Runtime<*> = runtimeFactory.create(),
        source: URL = bundledSource
    ) : this(plugins.toList(), runtime, source)

    private val player: Node

    override val node: Node by ::player

    override val logger: TapableLogger by NodeSerializableField(TapableLogger.serializer())

    override val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    override val state: PlayerFlowState get() = if (player.isReleased()) ReleasedState else
        player.getFunction<Node>("getState")!!().deserialize(PlayerFlowState.serializer())

    init {
        /** 1. load source into the [runtime] and release lock */
        runtime.execute(source.readText())

        /** 2. apply JS plugins and build [JSPlayerConfig] */
        val config = plugins
            .filterIsInstance<RuntimePlugin>()
            .onEach { it.apply(runtime) }
            .filterIsInstance<JSPluginWrapper>()
            .let(::JSPlayerConfig)

        /** 3. Build JS headless player */
        runtime.add("config", config)
        player = runtime.execute("new Player.Player(config)") as? Node
            ?: throw PlayerException("Couldn't create backing JS Player w/ config: $config")

        /** 4. apply to player plugins */
        plugins
            .filterIsInstance<PlayerPlugin>()
            .onEach { it.apply(this) }

        /** 5. apply logger plugins */
        loggers
            .filterNot { plugins.map { it::class }.contains(it::class) }
            .forEach(logger::addHandler)
    }

    override fun start(flow: String): Completable<CompletedState> = start(runtime.execute("($flow)") as Node)

    public fun start(flow: Node): Completable<CompletedState> = PlayerCompletable(player.getFunction<Node>("start")!!.invoke(flow))

    /** Start a [flow] and subscribe to the result */
    public fun start(flow: Node, onComplete: (Result<CompletedState>) -> Unit): Completable<CompletedState> =
        start(flow).apply {
            onComplete(onComplete)
        }

    override fun release() {
        // TODO: Call state hook!
        if (!runtime.isReleased()) {
            runtime.release()
        }
    }

    internal companion object {

        private const val bundledSourcePath = "core/player/dist/player.prod.js"

        /** Gets [URL] of the bundled source */
        private val bundledSource get() = this::class.java
            .classLoader.getResource(bundledSourcePath)!!
    }
}
