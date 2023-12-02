package com.intuit.player.plugins.pubsub

import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.findPlugin
import kotlinx.serialization.Serializable

/** Core plugin wrapper providing pub-sub support to the JVM player */
public class PubSubPlugin(public val config: Config? = null) : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath) {

    override fun apply(runtime: Runtime<*>) {
        config?.let {
            runtime.load(ScriptContext(if (runtime.config.debuggable) debugScript else script, bundledSourcePath))
            runtime.add("pubsubConfig", config)
            instance = runtime.buildInstance("(new $name(pubsubConfig))")
        } ?: super.apply(runtime)
    }

    /**
     * Subscribe to an event
     * @param eventName The name of the event to attach a handler to
     * @param block The handler to call when the event is received
     * @return subscription token used to [unsubscribe]
     */
    public fun subscribe(eventName: String, block: (String, Any?) -> Unit): String = instance
        .getInvokable<String>("subscribe")!!(eventName, block)

    /**
     * Cancel subscription registered with [token]
     * @param token subscription token obtained from [subscribe] call
     */
    public fun unsubscribe(token: String) {
        instance.getInvokable<Any?>("unsubscribe")!!(token)
    }

    /**
     * Publish an event through the plugin
     * @param eventName The name of the event
     * @param eventData Arbitrary data associated with the event
     */
    public fun publish(eventName: String, eventData: Any) {
        instance.getInvokable<Any?>("publish")!!(eventName, eventData)
    }

    @Serializable
    public data class Config(
        public val expressionName: String,
    )

    private companion object {
        private const val pluginName = "PubSubPlugin.PubSubPlugin"
        private const val bundledSourcePath = "plugins/pubsub/core/dist/pubsub-plugin.prod.js"
    }
}

/** Convenience getter to find the first [PubSubPlugin] registered to the [Player] */
public val Player.pubSubPlugin: PubSubPlugin? get() = findPlugin()

/** Convenience method for registering an pubsub handler without a reference to the [PubSubPlugin] */
public fun Player.subscribe(name: String, block: (String, Any?) -> Unit): String? = pubSubPlugin?.subscribe(name, block)

/** Convenience method for unsubscribing a specific subscription without a reference to the [PubSubPlugin] */
public fun Player.unsubscribe(subscriptionToken: String) {
    pubSubPlugin?.unsubscribe(subscriptionToken)
}
