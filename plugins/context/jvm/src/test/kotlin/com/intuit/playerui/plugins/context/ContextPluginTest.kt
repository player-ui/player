package com.intuit.playerui.plugins.context

import com.intuit.playerui.utils.test.PlayerTest
import org.amshove.kluent.`should be equal to`
import org.amshove.kluent.`should be null`
import org.amshove.kluent.`should not be null`
import org.amshove.kluent.shouldBe
import org.junit.jupiter.api.TestTemplate
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.test.assertFailsWith

internal class ContextPluginTest : PlayerTest() {
    override val plugins = listOf(ContextPlugin())

    private val plugin get() = player.contextPlugin!!

    @TestTemplate
    fun `set and get round-trip a value`() {
        plugin.set("formState", "Current form state", mapOf("name" to "Ada"))
        plugin.get<Map<String, String>>("formState") `should be equal to` mapOf("name" to "Ada")
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
        plugin.get<Any?>("never-set").`should be null`()
    }

    @TestTemplate
    fun `get reads a primitive entry without wrapping it in a Node`() {
        plugin.set("answer", "The answer", 42)
        plugin.get<Int>("answer") `should be equal to` 42
    }

    @TestTemplate
    fun `list reports registered entry descriptors`() {
        plugin.set("flag", "A flag", true)

        val flag = plugin.list().first { it.description == "A flag" }
        flag.hasValue shouldBe true
    }

    @TestTemplate
    fun `a function-valued member crosses the bridge and is called directly off the typed object`() {
        // Mirrors how a consumer reads a structured context and invokes a
        // bridged action member: get<T>("name").someFunction(args).
        plugin.set(
            "form",
            "A form with an action",
            mapOf(
                "label" to "Greeter",
                "greet" to { name: Any? -> "hello $name" },
            ),
        )

        val form = plugin.get<FormContext>("form")!!
        form.label `should be equal to` "Greeter"
        form.greet("Ada") `should be equal to` "hello Ada"
    }
}

@kotlinx.serialization.Serializable
internal data class FormContext(
    val label: String,
    val greet: (String) -> String,
)

/**
 * Integration: with [StateContextPlugin] applied and a flow running, the
 * aggregated `player.state` entry is readable as a typed [PlayerStateContext]
 * and its construct-scoped actions are directly callable across the bridge.
 */
internal class StateContextPluginTest : PlayerTest() {
    override val plugins = listOf(ContextPlugin(), StateContextPlugin())

    private val plugin get() = player.contextPlugin!!

    @TestTemplate
    fun `player state context is readable and its scoped actions are callable`() {
        player.start(multiViewFlow)

        val state = plugin.get<PlayerStateContext>("player.state")!!
        state.status `should be equal to` "in-progress"
        state.flow.id `should be equal to` "flow-multi"
        state.flow.state `should be equal to` "VIEW_1"

        // Validation state deserializes across the bridge. With no binding
        // tracking (no rendering layer in this headless flow) it is empty and
        // transitionable.
        state.validation.canTransition `should be equal to` true
        state.validation.byBinding.isEmpty() `should be equal to` true

        // Actions are scoped to their constructs and bridged as callables.
        state.flow.transition.`should not be null`()
        state.data.set.`should not be null`()

        // The scoped data.set action drives the real data model; reading the
        // context back reflects the write.
        state.data.set!!("foo.bar", "baz")
        val model = plugin.get<PlayerStateContext>("player.state")!!.data.model as Map<*, *>
        (model["foo"] as Map<*, *>)["bar"] `should be equal to` "baz"

        // The scoped flow.transition action advances the flow to the next
        // (non-terminal) view — observable synchronously through the live
        // context, before any flow-end store rotation.
        state.flow.transition!!("Next")
        plugin.get<PlayerStateContext>("player.state")!!.flow.state `should be equal to` "VIEW_2"
    }

    @TestTemplate
    fun `flow end freezes a typed history snapshot capturing the terminal state`() {
        // Flow end (onEnd -> freeze -> rotate) is async, so await completion
        // before asserting on the frozen snapshot.
        val done = CountDownLatch(1)
        player.start(multiViewFlow) { done.countDown() }

        plugin.get<PlayerStateContext>("player.state")!!.flow.transition!!("Done")
        done.await(5, TimeUnit.SECONDS) shouldBe true

        val snapshot = plugin.history().last()
        snapshot.flowId `should be equal to` "flow-multi"
        // Read the frozen entry by name — the same typed access as live context.
        snapshot.get<String>("player.flow.state") `should be equal to` "END_Done"
        // Absent keys read back as null.
        snapshot.get<String>("never.frozen").`should be null`()
    }

    @TestTemplate
    fun `frozen snapshot actions are tombstoned and throw when invoked`() {
        val done = CountDownLatch(1)
        player.start(multiViewFlow) { done.countDown() }
        plugin.get<PlayerStateContext>("player.state")!!.flow.transition!!("Done")
        done.await(5, TimeUnit.SECONDS) shouldBe true

        // The frozen player.state aggregate retains its scoped actions, but they
        // are tombstoned — the action is still present (non-null) yet invoking
        // it throws because the flow it was bound to has ended.
        val frozenState = plugin.history().last().get<PlayerStateContext>("player.state")!!
        frozenState.flow.transition.`should not be null`()
        assertFailsWith<Exception> { frozenState.flow.transition!!("Next") }
    }

    private companion object {
        private val multiViewFlow =
            """
            {
              "id": "flow-multi",
              "views": [
                { "id": "view-1", "type": "info" },
                { "id": "view-2", "type": "info" }
              ],
              "navigation": {
                "BEGIN": "FLOW_1",
                "FLOW_1": {
                  "startState": "VIEW_1",
                  "VIEW_1": {
                    "ref": "view-1",
                    "state_type": "VIEW",
                    "transitions": { "Next": "VIEW_2", "*": "END_Done" }
                  },
                  "VIEW_2": {
                    "ref": "view-2",
                    "state_type": "VIEW",
                    "transitions": { "*": "END_Done" }
                  },
                  "END_Done": { "state_type": "END", "outcome": "done" }
                }
              }
            }
            """.trimIndent()
    }
}
