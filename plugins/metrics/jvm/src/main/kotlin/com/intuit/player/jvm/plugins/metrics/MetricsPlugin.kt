package com.intuit.player.jvm.plugins.metrics

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.runtime.ScriptContext
import com.intuit.player.jvm.core.bridge.runtime.add
import com.intuit.player.jvm.core.player.Player
import com.intuit.player.jvm.core.plugins.JSScriptPluginWrapper
import com.intuit.player.jvm.core.plugins.PlayerPlugin
import com.intuit.player.jvm.core.plugins.findPlugin

public typealias RenderEndHandler = (Timing?, RenderMetrics?, PlayerFlowMetrics?) -> Unit

public class MetricsPlugin(
    private val handler: RenderEndHandler,
) : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath) {

    override fun apply(runtime: Runtime<*>) {
        runtime.load(ScriptContext(if (runtime.config.debuggable) debugScript else script, bundledSourcePath))
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
    }

    public fun renderEnd(): Unit = instance.getInvokable<Unit>("renderEnd")!!()

    private companion object {
        private const val bundledSourcePath = "plugins/metrics/core/dist/metrics-plugin.prod.js"
        private const val pluginName = "MetricsPlugin.MetricsCorePlugin"
    }
}

/** Convenience getter to find the first [MetricsPlugin] registered to the [Player] */
public val Player.metricsPlugin: MetricsPlugin? get() = findPlugin()

public typealias RequestTimeClosure = () -> Int

/** Wrapper around RequestTimeWebPlugin, which needs to apply to MetricsPlugin */
internal class RequestTimeWebPlugin(
    private val getRequestTime: RequestTimeClosure,
) : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath) {

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
        private const val bundledSourcePath = "plugins/metrics/core/dist/metrics-plugin.prod.js"
        private const val pluginName = "MetricsPlugin.RequestTimeWebPlugin"
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
