package com.intuit.player.plugins.pubsub

import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.core.expressions.evaluate
import com.intuit.player.jvm.core.player.state.inProgressState
import com.intuit.player.jvm.utils.test.PlayerTest
import com.intuit.player.jvm.utils.test.setupPlayer
import com.intuit.player.jvm.utils.test.simpleFlowString
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.amshove.kluent.`should be equal to`
import org.amshove.kluent.`should be instance of`
import org.amshove.kluent.`should be null`
import org.amshove.kluent.shouldBe
import org.junit.jupiter.api.TestTemplate

internal class PubSubPluginTest : PlayerTest() {

    override val plugins = listOf(PubSubPlugin())

    private val plugin get() = player.pubSubPlugin!!

    @TestTemplate
    fun `subscribe shouldbe Unit`() {
        plugin.subscribe("eventName") { _, _ -> } `should be instance of` String::class
    }

    @TestTemplate
    fun `publish shouldbe Unit`() {
        plugin.publish("eventName", "eventData") shouldBe Unit
    }

    @TestTemplate
    fun `unsubscribe should remove handler`() {
        val (expectedName, expectedData) = "eventName" to "eventData"
        var name: String? = null
        var data: Any? = null

        val token = plugin.subscribe(expectedName) { n, d -> name = n; data = d; println("EVENT: $n: ${Json.encodeToString(GenericSerializer(), d)}") }
        plugin.unsubscribe(token)
        plugin.publish(expectedName, expectedData)

        name.`should be null`()
        data.`should be null`()
    }

    @TestTemplate
    fun pubsubWithString() {
        val (expectedName, expectedData) = "eventName" to "eventData"
        var name: String? = null
        var data: Any? = null
        plugin.subscribe(expectedName) { n, d -> name = n; data = d; println("EVENT: $n: ${Json.encodeToString(GenericSerializer(), d)}") }
        plugin.publish(expectedName, expectedData)

        name `should be equal to` expectedName
        data `should be equal to` expectedData
    }

    @TestTemplate
    fun pubsubWithJson() {
        val (expectedName, expectedData) = "eventName" to buildJsonObject {
            put("some", "data")
        }
        var name: String? = null
        var data: Any? = null
        plugin.subscribe(expectedName) { n, d -> name = n; data = d; println("EVENT: $n: ${Json.encodeToString(GenericSerializer(), d)}") }
        plugin.publish(expectedName, expectedData)

        name `should be equal to` expectedName
        data `should be equal to` Json.decodeFromJsonElement(MapSerializer(GenericSerializer(), GenericSerializer()), expectedData)
    }

    @TestTemplate
    fun pubsubWithMap() {
        val (expectedName, expectedData) = "eventName" to mapOf(
            "some" to "data"
        )
        var name: String? = null
        var data: Any? = null
        plugin.subscribe(expectedName) { n, d -> name = n; data = d; println("EVENT: $n: ${Json.encodeToString(GenericSerializer(), d)}") }
        plugin.publish(expectedName, expectedData)

        name `should be equal to` expectedName
        data `should be equal to` expectedData
    }

    @TestTemplate
    fun pubsubWithV8Object() {
        val (expectedName, expectedData) = "eventName" to mapOf(
            "some" to "data"
        )
        var name: String? = null
        var data: Any? = null
        plugin.subscribe(expectedName) { n, d -> name = n; data = d; println("EVENT: $n: ${Json.encodeToString(GenericSerializer(), d)}") }
        plugin.publish(
            expectedName,
            expectedData
        )

        name `should be equal to` expectedName
        data `should be equal to` expectedData
    }

    @TestTemplate
    fun pubsubWithDefaultName() {
        val (expectedName, expectedData) = "eventName" to mapOf(
            "some" to "data"
        )
        var name: String? = null
        var data: Any? = null
        plugin.subscribe(expectedName) { n, d -> name = n; data = d; println("EVENT: $n: ${Json.encodeToString(GenericSerializer(), d)}") }
        player.start(simpleFlowString)
        player.inProgressState!!.evaluate("""@[publish("$expectedName", ${Json.encodeToString(expectedData)})]@""")

        name `should be equal to` expectedName
        data `should be equal to` expectedData
    }

    @TestTemplate
    fun pubsubWithCustomName() {
        setupPlayer(PubSubPlugin(PubSubPlugin.Config("publishEvent")))
        val (expectedName, expectedData) = "eventName" to mapOf(
            "some" to "data"
        )
        var name: String? = null
        var data: Any? = null
        plugin.subscribe(expectedName) { n, d -> name = n; data = d; println("EVENT: $n: ${Json.encodeToString(GenericSerializer(), d)}") }
        player.start(simpleFlowString)
        player.inProgressState!!.evaluate("""@[publishEvent("$expectedName", ${Json.encodeToString(expectedData)})]@""")

        name `should be equal to` expectedName
        data `should be equal to` expectedData
    }
}
