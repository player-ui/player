package com.intuit.player.plugins.devtools

import com.facebook.flipper.core.FlipperConnection
import com.facebook.flipper.core.FlipperObject
import com.facebook.flipper.core.FlipperPlugin
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.encodeToJsonElement

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
                supportedMethods.forEach {
                    connection.receive(it) { event, response ->
                        val method: Method = event.toJsonString().let(Json::encodeToJsonElement).let(Json::decodeFromJsonElement)
                        activePlayers[method.playerID]?.onMethod(method)?.asFlipperObject?.let(response::success)
                            ?: response.success() // TODO: Do we error back?
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
}