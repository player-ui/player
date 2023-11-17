package com.intuit.player.plugins.beacon

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.runtime.add
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.core.player.Player
import com.intuit.player.jvm.core.plugins.JSPluginWrapper
import com.intuit.player.jvm.core.plugins.JSScriptPluginWrapper
import com.intuit.player.jvm.core.plugins.Pluggable
import com.intuit.player.jvm.core.plugins.findPlugin
import com.intuit.player.plugins.settimeout.SetTimeoutPlugin
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

        runtime.execute(script)
        runtime.add("beaconOptions", config)
        instance = runtime.buildInstance("(new $name.$name(beaconOptions))")
    }

    private val handlers: MutableList<(String) -> Unit> = mutableListOf()

    /** Register beaconing [handler]. Will be called on every beacon event */
    public fun registerHandler(handler: (String) -> Unit) {
        handlers.add(handler)
    }

    /** Fire a beacon event */
    public fun beacon(action: String, element: String, asset: Asset, data: Any? = null) {
        instance.getInvokable<Any?>("beacon")!!.invoke(
            mapOf(
                "action" to action,
                "element" to element,
                "asset" to asset,
                "data" to data,
            )
        )
    }

    private companion object {
        private const val pluginName = "BeaconPlugin"
        private const val bundledSourcePath = "plugins/beacon/core/dist/beacon-plugin.prod.js"
    }

    @Serializable
    internal data class JSBeaconPluginConfig(
        val plugins: List<JSPluginWrapper>,
        val callback: (@Contextual Any?) -> Unit
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
