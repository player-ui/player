package com.intuit.player.plugins.devtools

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.getSerializable
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.runtime.add
import com.intuit.player.jvm.core.bridge.toJson
import com.intuit.player.jvm.core.player.Player
import com.intuit.player.jvm.core.plugins.JSScriptPluginWrapper
import com.intuit.player.jvm.core.plugins.LoggerPlugin
import com.intuit.player.jvm.core.plugins.PlayerPlugin
import com.intuit.player.jvm.core.plugins.PlayerPluginException
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import java.util.*

public fun interface DevtoolsEventPublisher {
    public fun publish(message: JsonObject)
}

public interface DevtoolsMethodHandler {
    public val supportedMethods: Set<String>
    public fun onMethod(type: String, params: JsonObject): JsonObject
}

public class DevtoolsPlugin(public val playerID: String, public var onEvent: DevtoolsEventPublisher? = null) : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath), PlayerPlugin, DevtoolsMethodHandler {


    private lateinit var logger: LoggerPlugin

    private val callbacks: Map<String, (JsonObject) -> Node> by lazy {
        instance.getSerializable("callbacks") ?: throw PlayerPluginException("callbacks not defined on instance")
    }

    // TODO: Listen for JVM/Android specific events
    override fun onMethod(type: String, params: JsonObject): JsonObject = (callbacks[type]
        ?: throw PlayerPluginException("method handler for ${type} not found"))
        .invoke(params)
        .toJson()
        .jsonObject

    override val supportedMethods: Set<String> get() = callbacks.keys

    override fun apply(player: Player) {
        logger = player.logger
    }

    override fun apply(runtime: Runtime<*>) {
        // TODO: Polyfill WeakRef
        runtime.execute("class WeakRef { value = null; constructor(value) { this.value = value }; deref() { return this.value } }")
        runtime.add(
            "performance",
            mapOf(
                "now" to {
                    System.currentTimeMillis()
                }
            )
        )

        runtime.execute(script)
        val publisher = "devtoolsPublisher_${UUID.randomUUID().toString().replace("-", "")}"
        runtime.add(publisher) { event: Node ->
            // TODO: Update format decoders to handle this
            onEvent?.publish(event.toJson().jsonObject)
        }
        instance = runtime.buildInstance("""(new $name.$name("$playerID", $publisher))""")
    }

    private companion object {
        private const val pluginName = "DevtoolsPlugin"
        private const val bundledSourcePath = "plugins/devtools/core/dist/devtools-plugin.prod.js"
    }
}
