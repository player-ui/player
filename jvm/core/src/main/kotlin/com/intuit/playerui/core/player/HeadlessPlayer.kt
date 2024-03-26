package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.Completable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.Promise
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeConfig
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.bridge.runtime.runtimeFactory
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.logger.TapableLogger
import com.intuit.playerui.core.player.HeadlessPlayer.Companion.bundledSource
import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.core.player.state.ReleasedState
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.plugins.JSPluginWrapper
import com.intuit.playerui.core.plugins.LoggerPlugin
import com.intuit.playerui.core.plugins.PlayerPlugin
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.core.plugins.RuntimePlugin
import com.intuit.playerui.core.plugins.logging.loggers
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
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
public class HeadlessPlayer
@ExperimentalPlayerApi
@JvmOverloads
public constructor(
    override val plugins: List<Plugin>,
    explicitRuntime: Runtime<*>? = null,
    private val source: URL = bundledSource,
    config: PlayerRuntimeConfig = PlayerRuntimeConfig(),
) : Player(), NodeWrapper {

    /** Convenience constructor to allow [plugins] to be passed as varargs */
    @ExperimentalPlayerApi @JvmOverloads
    public constructor(
        vararg plugins: Plugin,
        config: PlayerRuntimeConfig = PlayerRuntimeConfig(),
        explicitRuntime: Runtime<*>? = null,
        source: URL = bundledSource,
    ) : this(plugins.toList(), explicitRuntime, source, config)

    public constructor(
        explicitRuntime: Runtime<*>,
        vararg plugins: Plugin,
    ) : this(plugins.toList(), explicitRuntime, config = explicitRuntime.config)

    private val player: Node

    override val node: Node by ::player

    override val logger: TapableLogger by NodeSerializableField(TapableLogger.serializer(), NodeSerializableField.CacheStrategy.Full)

    override val hooks: Hooks by NodeSerializableField(Hooks.serializer(), NodeSerializableField.CacheStrategy.Full)

    override val state: PlayerFlowState get() = if (player.isReleased()) {
        ReleasedState
    } else {
        player.getInvokable<Node>("getState")!!().deserialize(PlayerFlowState.serializer())
    }

    public val runtime: Runtime<*> = explicitRuntime ?: runtimeFactory.create {
        debuggable = config.debuggable
        coroutineExceptionHandler = config.coroutineExceptionHandler ?: CoroutineExceptionHandler { _, throwable ->
            inProgressState?.fail(throwable) ?: logger.error(
                "Exception caught in Player scope: ${throwable.message}",
                throwable.stackTrace.joinToString("\n") {
                    "\tat $it"
                }.replaceFirst("\tat ", "\n"),
            )
        }
    }

    override val scope: CoroutineScope by runtime::scope

    init {
        /** 1. load source into the [runtime] and release lock */
        runtime.load(ScriptContext(if (runtime.config.debuggable) debugSource.readText() else source.readText(), bundledSourcePath))

        /** 2. merge explicit [LoggerPlugin]s with ones created by service loader */
        val loggerPlugins = plugins.filterIsInstance<LoggerPlugin>().let { explicitLoggers ->
            val explicitLoggerPlugins = explicitLoggers.map { it::class }
            explicitLoggers + loggers { name = this@HeadlessPlayer::class.java.name }
                .filterNot { explicitLoggerPlugins.contains(it::class) }
        }

        /** 3. apply runtime plugins and build [JSPlayerConfig] */
        val config = plugins
            .filterIsInstance<RuntimePlugin>()
            .onEach { it.apply(runtime) }
            .filterIsInstance<JSPluginWrapper>()
            .let { JSPlayerConfig(it, loggerPlugins) }

        /** 4. build JS headless player */
        runtime.add("config", config)
        player = runtime.execute("new Player.Player(config)") as? Node
            ?: throw PlayerException("Couldn't create backing JS Player w/ config: $config")

        runtime.add("player", player)

        // we only have access to the logger after we have the player instance
        if (runtime.config.debuggable) {
            runtime.checkBlockingThread = {
                if (name == "main") {
                    scope.launch {
                        logger.warn(
                            "Main thread is blocking on JS runtime access: $this",
                            stackTrace.joinToString("\n") {
                                "\tat $it"
                            }.replaceFirst("\tat ", "\n"),
                        )
                    }
                }
            }
        }

        /** 5. apply to player plugins */
        plugins
            .filterIsInstance<PlayerPlugin>()
            .onEach { it.apply(this) }
    }

    override fun start(flow: String): Completable<CompletedState> = try {
        start(runtime.execute("($flow)") as Node)
    } catch (exception: Exception) {
        val wrapped = PlayerException("Could not load Player content", exception)
        inProgressState?.fail(wrapped) ?: hooks.state.call(hashMapOf(), arrayOf(ErrorState.from(wrapped)))
        PlayerCompletable(Promise.reject(wrapped))
    }

    public fun start(flow: Node): Completable<CompletedState> = PlayerCompletable(player.getInvokable<Node>("start")!!.invoke(flow))

    /** Start a [flow] and subscribe to the result */
    public fun start(flow: Node, onComplete: (Result<CompletedState>) -> Unit): Completable<CompletedState> =
        start(flow).apply {
            onComplete(onComplete)
        }

    override fun release() {
        if (!runtime.isReleased()) {
            hooks.state.call(HashMap(), arrayOf(ReleasedState))
            runtime.release()
        }
    }

    internal companion object {

        private const val bundledSourcePath = "core/player/dist/player.prod.js"
        private const val debugSourcePath = "core/player/dist/player.dev.js"

        /** Gets [URL] of the bundled source */
        private val bundledSource get() = this::class.java
            .classLoader.getResource(bundledSourcePath)!!

        private val debugSource get() = this::class.java
            .classLoader.getResource(debugSourcePath)!!
    }
}
