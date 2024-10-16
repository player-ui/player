package com.intuit.playerui.plugins.beacon

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.utils.test.RuntimePluginTest
import com.intuit.playerui.utils.test.runBlockingTest
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.amshove.kluent.`should be instance of`
import org.amshove.kluent.`should not be`
import org.amshove.kluent.`should not be null`
import org.amshove.kluent.shouldBe
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.TestTemplate

internal class BeaconPluginTest : RuntimePluginTest<BeaconPlugin>() {

    override fun buildPlugin() = BeaconPlugin()

    @TestTemplate
    fun `registerHandler should be Unit`() {
        plugin.registerHandler { "handler" } shouldBe Unit
    }

    @TestTemplate
    fun `beacon plugin should register SetTimeoutPlugin`() {
        val setTimeout = runtime["setTimeout"]
        setTimeout.`should not be null`()
        setTimeout `should not be` Unit
        setTimeout `should be instance of` Invokable::class
    }

    @TestTemplate
    fun `beacon should trigger handlers`() = runBlockingTest {
        var beaconed: JsonElement? = null
        var beaconed2: JsonElement? = null

        plugin.registerHandler { beaconed = Json.parseToJsonElement(it) }
        plugin.registerHandler { beaconed2 = Json.parseToJsonElement(it) }

        val action = "clicked"
        val element = "button"
        val assetId = "test-id"

        val shouldBeacon = buildJsonObject {
            put("action", action)
            put("element", element)
            put("assetId", assetId)
        }

        val asset = buildJsonObject {
            put("id", assetId)
            put("type", "text")
        }.asAsset()

        plugin.beacon(action, element, asset) shouldBe Unit
        while (beaconed == null || beaconed2 == null) runBlocking { delay(100) }
        assertEquals(shouldBeacon, beaconed)
        assertEquals(beaconed2, beaconed)
    }

    @TestTemplate
    fun `beacon should pass extra data`() {
        var beaconed: JsonElement? = null

        plugin.registerHandler { beaconed = Json.parseToJsonElement(it) }

        val action = "clicked"
        val element = "button"
        val (id, type) = "test-id" to "test"
        val data = buildJsonObject {
            put("extra", "data")
        }

        val shouldBeacon = buildJsonObject {
            put("action", action)
            put("element", element)
            put("assetId", id)
            put("data", data)
        }

        val asset = buildJsonObject {
            put("id", id)
            put("type", type)
        }.asAsset()

        plugin.beacon(action, element, asset, data) shouldBe Unit
        while (beaconed == null) runBlocking { delay(100) }
        assertEquals(shouldBeacon, beaconed)
    }

    @TestTemplate
    fun `should register plugins`(): Unit = runBlockingTest {
        setupPlugin(BeaconPlugin(object : JSScriptPluginWrapper("TTOBeaconPlugin", sourcePath = "tto-beacon-plugin.js") {}))

        var beaconed: JsonElement? = null
        var beaconed2: JsonElement? = null

        plugin.registerHandler { beaconed = Json.parseToJsonElement(it.replace(Regex("\"timestamp\":[0-9]*,"), "\"timestamp\":\"TIMESTAMP\",")) }
        plugin.registerHandler { beaconed2 = Json.parseToJsonElement(it.replace(Regex("\"timestamp\":[0-9]*,"), "\"timestamp\":\"TIMESTAMP\",")) }

        val action = "clicked"
        val element = "button"
        val (id, type) = "test-id" to "test"

        val shouldBeacon = buildJsonObject {
            put("action", action)
            put("assetElement", element)
            put("asset", id)
            put("assetType", type)
            put("timestamp", "TIMESTAMP")
        }

        val asset = buildJsonObject {
            put("id", id)
            put("type", type)
        }.asAsset()

        plugin.beacon(action, element, asset) shouldBe Unit
        while (beaconed == null) runBlocking { delay(100) }
        assertEquals(shouldBeacon, beaconed)
        assertEquals(beaconed2, beaconed)
    }

    private fun JsonObject.asAsset(): Asset = runtime.serialize(this) as Asset
}
