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
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import java.util.*

public fun interface DevtoolsEventPublisher {
    public fun publish(message: JsonObject)
}

@Serializable public data class Method(public val type: String, public val params: JsonObject)

public val Method.playerID: String? get() = params["playerID"]?.jsonPrimitive?.content

public class DevtoolsPlugin(public val playerID: String, public var onEvent: DevtoolsEventPublisher? = null) : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath), PlayerPlugin {

    public val isReleased: Boolean get() = instance.isReleased()

    private lateinit var logger: LoggerPlugin

    // TODO: Build out interop delegates
    private fun callback(method: String, params: JsonObject) = instance
        .getObject("callbacks")!!
        .getFunction<Node>(method)!!
        .invoke(params)
        .toJson()
        .jsonObject

    private val callbacks: Map<String, (JsonObject) -> JsonObject> by lazy {
        instance.getSerializable("callbacks") ?: throw PlayerPluginException("callbacks not defined on instance")
    }

    public fun onMethod(method: Method): JsonObject = (callbacks[method.type] ?: throw PlayerPluginException("method handler for ${method.type} not found"))
        .invoke(method.params)

    public val supportedMethods: Set<String> by callbacks::keys

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
            try {
                // TODO: Update format decoders to handle this
                onEvent?.publish(Json.decodeFromJsonElement(event.toJson()))
            } catch (exception: Exception) {
                // TODO: Verify which order to log things here
                logger.error(exception, "Couldn't deserialize event: $event")
            }
        }
        instance = runtime.buildInstance("""(new $name.$name("$playerID", $publisher))""")
    }

    private companion object {
        private const val pluginName = "DevtoolsPlugin"
        private const val bundledSourcePath = "plugins/devtools/core/dist/devtools-plugin.prod.js"
    }
}
