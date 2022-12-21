package com.intuit.player.plugins.devtools

import com.facebook.flipper.core.FlipperConnection
import com.facebook.flipper.core.FlipperObject
import com.facebook.flipper.core.FlipperPlugin
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject

// TODO: Currently, this works as a "singleton" proxy for connecting flipper events to specific player plugins.
//  In the future, it'd be nice to have _each_ player plugin register it's own flipper plugin, such that the
//  flipper client automatically organizes _each_ player instance as it's own connection
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

    private val json = Json { ignoreUnknownKeys = true }

    public var supportedMethods: Set<String> = setOf()

    private var activePlayers: MutableMap<String, AndroidDevtoolsPlugin> = mutableMapOf()

    public fun addPlayer(plugin: AndroidDevtoolsPlugin) {
        supportedMethods += plugin.supportedMethods
        activePlayers[plugin.playerID] = plugin
    }

    public fun removePlayer(plugin: AndroidDevtoolsPlugin) {
        activePlayers.remove(plugin.playerID)
    }

    private var connection: FlipperConnection? = null
        set(value) {
            value?.let { connection ->
                // on each connection, we have to reconfigure listener events
                supportedMethods.forEach { type ->
                    connection.receive(type) { params, response ->
                        activePlayers[params.getString("playerID")]
                            ?.onMethod(Method(type, params.asJsonObject))
                            ?.asFlipperObject
                            ?.let(response::success) ?: response.success() // TODO: Should we error back?
                    }
                }
            }

            field = value
        }

    internal fun publishAndroidMessage(message: JsonObject) {
        message.asFlipperObject.let {
            connection?.send(it.getString("type"), it)
        }
    }

    private val JsonObject.asFlipperObject: FlipperObject get() = let(Json::encodeToString)
        .let(::FlipperObject)

    private val FlipperObject.asJsonObject: JsonObject get() = toJsonString()
        .let(json::parseToJsonElement)
        .jsonObject
}