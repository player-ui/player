package com.intuit.playerui.plugins.beacon

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.hooks.NodeAsyncWaterfallHook2
import com.intuit.playerui.core.bridge.hooks.NodeSyncBailHook1
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.InvokableSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.core.plugins.JSPluginWrapper
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.Pluggable
import com.intuit.playerui.core.plugins.findPlugin
import com.intuit.playerui.plugins.settimeout.SetTimeoutPlugin
import kotlinx.serialization.Contextual
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json

public typealias LoggerType = Map<LogSeverity, Invokable<Unit>>

/**
 * Core beaconing plugin wrapper for the JVM. Beaconing format can be augmented with a wrapped core beaconing plugin passed in as [JSPluginWrapper]s.
 */
public open class BeaconPlugin(override val plugins: List<JSPluginWrapper>) : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath), Pluggable {

    public constructor(vararg plugins: JSPluginWrapper) : this(plugins.toList())

    public lateinit var hooks: Hooks

    override fun apply(runtime: Runtime<*>) {
        SetTimeoutPlugin().apply(runtime)

        val config = plugins
            .onEach { it.apply(runtime) }
            .let {
                JSBeaconPluginConfig(it) { beacon ->
                    // Unfortunately, the timestamp value comes back as a Double, which is
                    // represented as scientific notation in JSON, so we must manually convert
                    val transformedBeacon = (beacon as? Map<*, *>)?.entries?.associate { (k, v) ->
                        k to when (v) {
                            is Double -> v.toLong()
                            else -> v
                        }
                    }

                    handlers.forEach { it(Json.encodeToString(GenericSerializer(), transformedBeacon)) }
                }
            }

        runtime.load(ScriptContext(script, bundledSourcePath))
        runtime.add("beaconOptions", config)
        instance = runtime.buildInstance("(new $name.$name(beaconOptions))")
        hooks = instance.getSerializable("hooks", Hooks.serializer())
            ?: throw PlayerException("BeaconPlugin is not loaded correctly")
    }

    private val handlers: MutableList<(String) -> Unit> = mutableListOf()

    /** Register beaconing [handler]. Will be called on every beacon event */
    public fun registerHandler(handler: (String) -> Unit) {
        handlers.add(handler)
    }

    // TODO: Convert to suspend method to ensure view scope is captured in a non-blocking way
    /** Fire a beacon event */
    public fun beacon(action: String, element: String, asset: Asset, data: Any? = null) {
        instance.getInvokable<Any?>("beacon")!!.invoke(
            mapOf(
                "action" to action,
                "element" to element,
                "asset" to asset,
                "data" to data,
            ),
        )
    }

    @Serializable(Hooks.Serializer::class)
    public class Hooks internal constructor(override val node: Node) : NodeWrapper {
        /** A hook to build beacon */
        public val buildBeacon: NodeAsyncWaterfallHook2<Any?, HookArgs>
            by NodeSerializableField(NodeAsyncWaterfallHook2.serializer(GenericSerializer(), HookArgs.serializer()))

        /** A hook to cancel beacon */
        public val cancelBeacon: NodeSyncBailHook1<HookArgs, Boolean>
            by NodeSerializableField(NodeSyncBailHook1.serializer(HookArgs.serializer(), Boolean.serializer()))

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    @Serializable(HookArgs.Serializer::class)
    public class HookArgs internal constructor(override val node: Node) : NodeWrapper {
        /** The current player state */
        public val state: PlayerFlowState? by NodeSerializableField(PlayerFlowState.serializer().nullable)

        /** The beacon plugin logger */
        public val logger: LoggerType by NodeSerializableField(
            MapSerializer(
                LogSeverity.serializer(),
                InvokableSerializer(GenericSerializer()) as KSerializer<Invokable<Unit>>,
            ),
        )

        /** The action being performed */
        public val action: String by NodeSerializableField(String.serializer())

        /** The specific element that the beacon originated from */
        public val element: String by NodeSerializableField(String.serializer())

        /** The asset firing the beacon */
        public val asset: Asset by NodeSerializableField(Asset.serializer())

        /** The current view */
        public val view: Asset? by NodeSerializableField(Asset.serializer().nullable)

        /** Any additional data to attach to the event */
        public val data: Any? by NodeSerializableField(GenericSerializer())

        internal object Serializer : NodeWrapperSerializer<HookArgs>(::HookArgs)
    }

    private companion object {
        private const val pluginName = "BeaconPlugin"
        private const val bundledSourcePath = "plugins/beacon/core/dist/BeaconPlugin.native.js"
    }

    @Serializable
    internal data class JSBeaconPluginConfig(
        val plugins: List<JSPluginWrapper>,
        val callback: (@Contextual Any?) -> Unit,
    )
}

@Serializable
public enum class LogSeverity {
    TRACE, DEBUG, INFO, WARN, ERROR
}

/** Convenience getter to find the first [BeaconPlugin] registered to the [Player] */
public val Player.beaconPlugin: BeaconPlugin? get() = findPlugin()

/** Convenience method for registering beacon handler without a reference to the [BeaconPlugin] */
public fun Player.onBeacon(block: (String) -> Unit) {
    beaconPlugin?.registerHandler(block)
}

/** Convenience method for firing a beacon without a reference to the [BeaconPlugin] */
public fun Player.beacon(action: String, element: String, asset: Asset, data: Any? = null) {
    beaconPlugin?.beacon(action, element, asset, data)
}
