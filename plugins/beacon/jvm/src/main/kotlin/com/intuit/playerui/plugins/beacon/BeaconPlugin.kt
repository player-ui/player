package com.intuit.playerui.plugins.beacon

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.JSPluginWrapper
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.Pluggable
import com.intuit.playerui.core.plugins.findPlugin
import com.intuit.playerui.plugins.settimeout.SetTimeoutPlugin
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * Core beaconing plugin wrapper for the JVM. Beaconing format can be augmented with a wrapped core beaconing plugin passed in as [JSPluginWrapper]s.
 */
public class BeaconPlugin(override val plugins: List<JSPluginWrapper>) : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath), Pluggable {

    public constructor(vararg plugins: JSPluginWrapper) : this(plugins.toList())

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
