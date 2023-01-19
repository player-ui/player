package com.intuit.player.plugins.devtools

import com.facebook.flipper.core.FlipperConnection
import com.facebook.flipper.core.FlipperObject
import com.facebook.flipper.core.FlipperPlugin
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject

// TODO: Currently, this works as a "singleton" proxy for connecting flipper events to specific player plugins.
//  In the future, it'd be nice to have _each_ player plugin register its own flipper plugin, such that the
//  flipper client automatically organizes _each_ player instance as its own connection
public class DevtoolsFlipperPlugin : FlipperPlugin {

    // TODO: Generate this or pull it from TS?
    override fun getId(): String = "player-ui-devtools"

    override fun onConnect(connection: FlipperConnection) {
        this.connection = connection
    }

    override fun onDisconnect() {
        connection = null
    }

    override fun runInBackground(): Boolean = false

    private var activePlayers: MutableMap<String, AndroidDevtoolsPlugin> = mutableMapOf()

    private var connection: FlipperConnection? = null; set(value) {
        field = value?.apply {
            // on new connection, we have to reconfigure listener events
            configureMethodListeners()
        }
    }

    /** Register method handlers for incoming Flipper method requests corresponding to a specific [AndroidDevtoolsPlugin.playerID] */
    public fun register(plugin: AndroidDevtoolsPlugin) {
        activePlayers[plugin.playerID] = plugin

        // on new player, we have to reconfigure listener events
        // to ensure we're listening for all the supported methods
        connection?.configureMethodListeners()
    }

    /** Remove method handlers for specific [AndroidDevtoolsPlugin.playerID] */
    public fun remove(plugin: AndroidDevtoolsPlugin) {
        activePlayers.remove(plugin.playerID)
    }

    /** Publish [message] to the current Flipper [connection] */
    internal fun publishAndroidMessage(message: JsonObject) {
        message.asFlipperObject.let {
            connection?.send(it.getString("type"), it)
        }
    }

    private fun FlipperConnection.configureMethodListeners() {
        activePlayers.values.flatMap(AndroidDevtoolsPlugin::supportedMethods)
            .toSet()
            .forEach { type ->
                receive(type) { params, response ->
                    activePlayers[params.getString("playerID")]
                        ?.onMethod(type, params.asJsonObject)
                        ?.asFlipperObject
                        ?.let(response::success) ?: response.success() // TODO: Should we error back?
                }
            }
    }

    private val JsonObject.asFlipperObject: FlipperObject get() = let(Json::encodeToString)
        .let(::FlipperObject)

    private val FlipperObject.asJsonObject: JsonObject get() = toJsonString()
        .let(json::parseToJsonElement)
        .jsonObject

    private companion object {
        private val json = Json { ignoreUnknownKeys = true }
    }
}