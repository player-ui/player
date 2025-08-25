package com.intuit.playerui.plugins.metrics

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook1
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook3
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.PlayerPlugin
import com.intuit.playerui.core.plugins.findPlugin
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.serializer

public typealias RenderEndHandler = (Timing?, RenderMetrics?, PlayerFlowMetrics?) -> Unit

public class MetricsPlugin(
    private val handler: RenderEndHandler,
) : JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH) {
    public lateinit var hooks: Hooks

    override fun apply(runtime: Runtime<*>) {
        runtime.load(ScriptContext(script, BUNDLED_SOURCE_PATH))
        runtime.add(
            "handlers",
            mapOf(
                "onRenderEnd" to renderEndHandler@{ timing: Node, renderMetrics: Node, flowMetrics: Node ->
                    handler.invoke(
                        timing.deserialize(Timing.serializer()),
                        renderMetrics.deserialize(RenderMetrics.serializer()),
                        flowMetrics.deserialize(PlayerFlowMetrics.serializer()),
                    )
                },
                "trackRenderTime" to true,
            ),
        )
        instance = runtime.buildInstance("(new $name(handlers))")
        hooks = instance.getSerializable("hooks", Hooks.serializer())
            ?: throw PlayerException("MetricsPlugin is not loaded correctly")
    }

    @Serializable(Hooks.Serializer::class)
    public class Hooks internal constructor(
        override val node: Node,
    ) : NodeWrapper {
        public val onFlowBegin: NodeSyncHook1<PlayerFlowMetrics>
            by NodeSerializableField(NodeSyncHook1.serializer(PlayerFlowMetrics.serializer()))

        public val onFlowEnd: NodeSyncHook1<PlayerFlowMetrics>
            by NodeSerializableField(NodeSyncHook1.serializer(PlayerFlowMetrics.serializer()))

        public val onRenderEnd: NodeSyncHook3<Timing, RenderMetrics, PlayerFlowMetrics>
            by NodeSerializableField(
                NodeSyncHook3.serializer(
                    Timing.serializer(),
                    RenderMetrics.serializer(),
                    PlayerFlowMetrics.serializer(),
                ),
            )

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    public fun renderEnd(): Unit = instance.getInvokable<Unit>("renderEnd")!!()

    private companion object {
        private const val BUNDLED_SOURCE_PATH = "plugins/metrics/core/dist/MetricsPlugin.native.js"
        private const val PLUGIN_NAME = "MetricsPlugin.MetricsCorePlugin"
    }
}

/** Convenience getter to find the first [MetricsPlugin] registered to the [Player] */
public val Player.metricsPlugin: MetricsPlugin? get() = findPlugin()

public typealias RequestTimeClosure = () -> Int

/** Wrapper around RequestTimeWebPlugin, which needs to apply to MetricsPlugin */
internal class RequestTimeWebPlugin(
    private val getRequestTime: RequestTimeClosure,
) : JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH) {
    override fun apply(runtime: Runtime<*>) {
        if (!runtime.contains(name)) {
            runtime.execute(script)
        }
        runtime.add(
            "callback",
        ) getRequestTime@{ getRequestTime.invoke() }
        instance = runtime.buildInstance("(new $name(callback))")
    }

    public fun apply(metricsPlugin: MetricsPlugin) {
        apply(metricsPlugin.instance.runtime)
        instance.getInvokable<Any>("apply")?.invoke(metricsPlugin.instance)
    }

    private companion object {
        private const val BUNDLED_SOURCE_PATH = "plugins/metrics/core/dist/MetricsPlugin.native.js"
        private const val PLUGIN_NAME = "MetricsPlugin.RequestTimeWebPlugin"
    }
}

/** A plugin to supply request time to MetricsPlugin */
public class RequestTimePlugin(
    private val getRequestTime: RequestTimeClosure,
) : PlayerPlugin {
    private val requestTimeWebPlugin = RequestTimeWebPlugin(getRequestTime)

    override fun apply(player: Player) {
        player.metricsPlugin?.let(requestTimeWebPlugin::apply)
    }
}

public val Player.requestTimePlugin: RequestTimePlugin? get() = findPlugin()
