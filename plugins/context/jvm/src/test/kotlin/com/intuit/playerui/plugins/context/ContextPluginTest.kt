package com.intuit.playerui.plugins.context

import com.intuit.playerui.utils.test.PlayerTest
import org.amshove.kluent.`should be equal to`
import org.amshove.kluent.`should be null`
import org.amshove.kluent.shouldBe
import org.junit.jupiter.api.TestTemplate

internal class ContextPluginTest : PlayerTest() {
    override val plugins = listOf(ContextPlugin())

    private val plugin get() = player.contextPlugin!!

    @TestTemplate
    fun `set and get round-trip a value`() {
        plugin.set("formState", "Current form state", mapOf("name" to "Ada"))
        plugin.get("formState") `should be equal to` mapOf("name" to "Ada")
    }

    @TestTemplate
    fun `has reflects presence`() {
        plugin.has("absent") shouldBe false
        plugin.set("present", "A flag", true)
        plugin.has("present") shouldBe true
    }

    @TestTemplate
    fun `subscribe receives updates for its key only`() {
        var received: Any? = null
        var receivedName: String? = null
        plugin.subscribe("counter", "A counter") { value, name ->
            received = value
            receivedName = name
        }

        plugin.set("counter", "A counter", 7)
        plugin.set("other", "Other", 99)

        received `should be equal to` 7
        receivedName `should be equal to` "counter"
    }

    @TestTemplate
    fun `subscribeAll receives every update`() {
        val events = mutableListOf<Triple<Any?, String?, String>>()
        plugin.subscribeAll { value, name, description ->
            events.add(Triple(value, name, description))
        }

        plugin.set("a", "A", 1)
        plugin.set("b", "B", 2)

        events.size shouldBe 2
        events[0] `should be equal to` Triple(1, "a", "A")
        events[1] `should be equal to` Triple(2, "b", "B")
    }

    @TestTemplate
    fun `unsubscribe stops further callbacks`() {
        var received: Any? = null
        val token = plugin.subscribe("k", "K") { value, _ -> received = value }
        plugin.set("k", "K", 1)
        plugin.unsubscribe(token)
        plugin.set("k", "K", 2)

        received `should be equal to` 1
    }

    @TestTemplate
    fun `get returns null when entry is absent`() {
        plugin.get("never-set").`should be null`()
    }
}
