package com.intuit.playerui.plugins.pubsub

import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.setupPlayer
import org.amshove.kluent.`should be equal to`
import org.amshove.kluent.`should be instance of`
import org.amshove.kluent.`should be null`
import org.amshove.kluent.shouldNotBe
import org.junit.jupiter.api.TestTemplate

internal class TinyPubSubTest : PlayerTest() {
    override val plugins = listOf<com.intuit.playerui.core.plugins.Plugin>()

    // MARK: - Initialization

    @TestTemplate
    fun `node is null before plugin setup`() {
        val bus = TinyPubSub()
        bus.node.`should be null`()
    }

    @TestTemplate
    fun `node is set after plugin applies to runtime`() {
        val bus = TinyPubSub()
        setupPlayer(PubSubPlugin(sharedPubSub = bus))
        bus.node shouldNotBe null
    }

    // MARK: - Subscribe / Publish

    @TestTemplate
    fun `subscribe returns a String token`() {
        val bus = TinyPubSub()
        setupPlayer(PubSubPlugin(sharedPubSub = bus))
        bus.subscribe("event") { _, _ -> } `should be instance of` String::class
    }

    @TestTemplate
    fun `subscribe and publish delivers event`() {
        val bus = TinyPubSub()
        setupPlayer(PubSubPlugin(sharedPubSub = bus))

        var receivedName: String? = null
        var receivedData: Any? = null
        bus.subscribe("myEvent") { name, data ->
            receivedName = name
            receivedData = data
        }

        bus.publish("myEvent", "payload")

        receivedName `should be equal to` "myEvent"
        receivedData `should be equal to` "payload"
    }

    // MARK: - Unsubscribe

    @TestTemplate
    fun `unsubscribe stops event delivery`() {
        val bus = TinyPubSub()
        setupPlayer(PubSubPlugin(sharedPubSub = bus))

        var callCount = 0
        val token = bus.subscribe("evt") { _, _ -> callCount++ }

        bus.publish("evt", "first")
        callCount `should be equal to` 1

        bus.unsubscribe(token)
        bus.publish("evt", "second")
        callCount `should be equal to` 1
    }

    // MARK: - Shared bus across plugins

    @TestTemplate
    fun `shared bus routes events from both expression names`() {
        val sharedBus = TinyPubSub()
        setupPlayer(
            PubSubPlugin(sharedPubSub = sharedBus),
            PubSubPlugin(PubSubPlugin.Config("customPublish"), sharedPubSub = sharedBus),
        )

        var callCount = 0
        sharedBus.subscribe("ping") { _, _ -> callCount++ }

        sharedBus.publish("ping", "data")
        callCount `should be equal to` 1
    }

    @TestTemplate
    fun `plugin setup initializes shared bus node`() {
        val sharedBus = TinyPubSub()
        sharedBus.node.`should be null`()

        setupPlayer(PubSubPlugin(sharedPubSub = sharedBus))
        sharedBus.node shouldNotBe null
    }

    @TestTemplate
    fun `second plugin using same bus does not reinitialize it`() {
        val sharedBus = TinyPubSub()
        setupPlayer(
            PubSubPlugin(sharedPubSub = sharedBus),
            PubSubPlugin(PubSubPlugin.Config("altPublish"), sharedPubSub = sharedBus),
        )

        // Both plugins share the same node reference
        val receivedEvents = mutableListOf<String>()
        sharedBus.subscribe("test") { _, _ -> receivedEvents.add("hit") }

        sharedBus.publish("test", "x")
        receivedEvents.size `should be equal to` 1
    }
}
