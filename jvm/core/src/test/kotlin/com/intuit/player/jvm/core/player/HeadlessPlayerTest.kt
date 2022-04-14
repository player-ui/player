package com.intuit.player.jvm.core.player

import com.intuit.player.jvm.core.bridge.JSErrorException
import com.intuit.player.jvm.core.bridge.global.JSMap
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.core.data.get
import com.intuit.player.jvm.core.data.set
import com.intuit.player.jvm.core.expressions.evaluate
import com.intuit.player.jvm.core.flow.Flow.Companion.UNKNOWN_ID
import com.intuit.player.jvm.core.flow.forceTransition
import com.intuit.player.jvm.core.flow.state.NavigationFlowStateType
import com.intuit.player.jvm.core.flow.state.NavigationFlowViewState
import com.intuit.player.jvm.core.player.state.*
import com.intuit.player.jvm.core.plugins.Plugin
import com.intuit.player.jvm.core.validation.BindingInstance
import com.intuit.player.jvm.core.validation.ValidationResponse
import com.intuit.player.jvm.core.validation.getWarningsAndErrors
import com.intuit.player.jvm.utils.filterKeys
import com.intuit.player.jvm.utils.test.*
import com.intuit.player.plugins.assets.ReferenceAssetsPlugin
import com.intuit.player.plugins.types.CommonTypesPlugin
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.TestTemplate
import kotlin.concurrent.thread

internal class HeadlessPlayerTest : PlayerTest(), ThreadUtils {

    // ThreadUtils
    override val threads = mutableListOf<Thread>()
    override val exceptions = mutableListOf<Throwable>()

    override val plugins: List<Plugin> = listOf(ReferenceAssetsPlugin(), CommonTypesPlugin())

    @TestTemplate
    fun `test player not started state`() {
        val state = player.state
        assertTrue(state is NotStartedState)
        assertEquals(PlayerFlowStatus.NOT_STARTED, state.status)
        assertNull(state.ref)
    }

    @TestTemplate
    fun `test player happy path`() = runBlockingTest {
        val flow = player.start(simpleFlowString)

        player.inProgressState?.transition("Next")

        val result = flow.await()
        assertEquals("done", result.endState.outcome)
        assertEquals("generated-flow", result.flow.id)
    }

    @TestTemplate
    fun `should be able to get additional END data in flow result`() = runBlockingTest {
        val flow = player.start(
            """{
  "id": "counter-flow",
  "views": [
    {
      "id": "action",
      "type": "action",
      "exp": "{{count}} = {{count}} + 1",
      "label": {
        "asset": {
          "id": "action-label",
          "type": "text",
          "value": "Clicked {{count}} times"
        }
      }
    }
  ],
  "data": {
    "count": 0
  },
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "action",
        "transitions": {
          "*": "END_Done"
        }
      },
      "END_Done": {
        "state_type": "END",
        "outcome": "done",
        "param": {
          "someKey": "someValue"
        },
        "extraKey": "extraValue",
        "extraObject": {
          "someInt": 1
        }
      }
    }
  }
}""".trimMargin()
        )

        player.inProgressState?.transition("Next")

        val result = flow.await()
        assertEquals("done", result.endState.outcome)
        assertEquals(mapOf("someKey" to "someValue"), result.endState["param"])
        assertEquals("extraValue", result.endState["extraKey"])
        assertEquals(mapOf("someInt" to 1), result.endState["extraObject"])
        assertEquals("counter-flow", result.flow.id)
    }

    @TestTemplate
    fun `test player can transition and skip validation`() = runBlockingTest {
        player.start(mocks.findMockByName("input-validation")!!.getFlow())

        assertEquals("VIEW_1", player.inProgressState!!.currentFlowState?.name)

        player.inProgressState!!.dataModel.set("person.age" to "asdf")
        player.inProgressState?.transition("Next")

        assertTrue(player.state is InProgressState)
        assertEquals("VIEW_1", player.inProgressState!!.currentFlowState?.name)
        player.inProgressState!!.forceTransition("Next")

        assertTrue(player.state is CompletedState)
        assertEquals("done", player.completedState!!.endState.outcome)
    }

    @TestTemplate
    fun `test player can get validation errors and warnings`() = runBlockingTest {
        var mapping: JSMap<BindingInstance, ValidationResponse>? = null
        player.hooks.viewController.tap { viewController ->
            viewController?.hooks?.view?.tap { view ->
                view?.hooks?.resolver?.tap { resolver ->
                    resolver?.hooks?.resolveOptions?.tap { resolveOptions, _ ->
                        mapping = resolveOptions?.validation?.getWarningsAndErrors()
                        resolveOptions
                    }
                }
            }
        }
        player.start(mocks.findMockByName("input-validation")!!.getFlow())

        val validationController = player.inProgressState!!.controllers.validation

        player.inProgressState!!.dataModel.set("foo.bar" to 21)
        assertNull(mapping)
        assertTrue(validationController.validateView().canTransition)

        player.inProgressState!!.dataModel.set("foo.bar" to "asdf")

        assertNotNull(mapping)
        assertFalse(validationController.validateView().canTransition)
        assertEquals("foo.bar", mapping!!.keys.first().asString())
        assertEquals("Value must be an integer", mapping!!.values.first().message)
    }

    @TestTemplate
    fun `test player in progress state`() = runBlockingTest {
        player.start(simpleFlowString)
        val state = player.state
        assertTrue(state is InProgressState)
        assertEquals(PlayerFlowStatus.IN_PROGRESS, state.status)
        assertNull(state.ref)

        state as InProgressState
        val flowResultCompletable = state.flowResult
        assertNotNull(state.currentView)

        // remove evaluated nodes
        val currentViewJson = Json.decodeFromJsonElement(
            GenericSerializer(),
            simpleFlow.views[0].jsonObject
                .filterKeys("applicability")
        )

        // remove transforms
        val withoutTransforms = state.lastViewUpdate!!.filterKeys("run")

        assertEquals(currentViewJson, withoutTransforms)

        val namedFlowState = state.currentFlowState
        val flowState = namedFlowState?.value
        assertEquals("VIEW_1", namedFlowState?.name)
        assertEquals(NavigationFlowStateType.VIEW, flowState?.stateType)
        flowState as NavigationFlowViewState
        assertEquals("view-1", flowState.ref)
        assertEquals(mapOf("*" to "END_Done"), flowState.transitions)

        state.evaluate("{{count}} = 0")
        repeat(10) {
            state.evaluate("{{count}} = {{count}} + 1")
        }
        assertEquals("some string", state.evaluate("{{count}} = {{count}} * 2", "\"some string\""))
        assertEquals(20, state.evaluate("{{count}}"))

        assertEquals(simpleFlow.id, state.flow.id)
        assertEquals(20, state.dataModel.get("count"))
        assertEquals(mapOf("count" to 20), state.dataModel.get())

        // test helper
        state.dataModel.set("count" to 40)
        assertEquals(40, state.dataModel.get("count"))

        state.dataModel.set(listOf(listOf("count", 80)))
        assertEquals(80, state.dataModel.get("count"))

        state.transition("Next")

        assertEquals("done", flowResultCompletable.await()!!.endState.outcome)
    }

    @TestTemplate
    fun `test inprogress player fails`() {
        player.start(simpleFlowString)
        val state = player.state
        assertTrue(state is InProgressState)
        state as InProgressState
        val cause = NullPointerException()
        val exception = PlayerException("hello", cause).apply {
            stackTrace = stackTrace.take(1).toTypedArray()
        }
        state.fail(exception)

        assertTrue(player.state is ErrorState)
        assertEquals(exception.message, player.errorState?.error?.message)
        assertEquals(exception.cause, cause)

        exception.printStackTrace()
        player.errorState?.error?.printStackTrace()
        assertEquals(exception.stackTrace.toList(), player.errorState?.error?.stackTrace?.toList())
    }

    @TestTemplate
    fun `test player error state`() = runBlockingTest {
        val exception = assertThrows(PlayerException::class.java) {
            runBlocking {
                player.start("""{}""").await()
            }
        }
        assertTrue(exception is JSErrorException)
        assertEquals("TypeError: Cannot read property 'BEGIN' of undefined", exception.message)

        val state = player.state
        assertEquals(PlayerFlowStatus.ERROR, state.status)
        assertTrue(state is ErrorState)
        state as ErrorState

        assertEquals(UNKNOWN_ID, state.flow.id)
    }

    @TestTemplate
    fun `test player onComplete success handling`() = runBlockingTest {
        val result = suspendCancellableCoroutine<Result<CompletedState>> { cont ->
            player.start(simpleFlowString).onComplete {
                cont.resume(it) {}
            }

            player.inProgressState?.transition("Next")
        }

        assertTrue(result.isSuccess)

        assertEquals("done", result.getOrThrow().endState.outcome)
        assertEquals("generated-flow", result.getOrThrow().flow.id)
    }

    @TestTemplate
    fun `test player onComplete error handling`() = runBlockingTest {
        val result = suspendCancellableCoroutine<Result<CompletedState>> { cont ->
            player.start("""{}""").onComplete {
                cont.resume(it) {}
            }
        }

        assertTrue(result.isFailure)
        assertEquals("TypeError: Cannot read property 'BEGIN' of undefined", result.exceptionOrNull()?.message)
    }

    @TestTemplate
    fun `test player access from multiple threads`() {
        val transitionThread = thread(start = false, name = "transition thread") {
            println("transitioning on thread 2")
            player.inProgressState?.transition("Next")
            runBlocking { delay(500) }
        }
        val startThread = thread(start = false, name = "start thread") {
            println("starting on thread 1")
            val flow = player.start(simpleFlowString)
            transitionThread.start()
            runBlocking { delay(500) }

            runBlocking {
                delay(1000)
                val result = flow.await()
                assertEquals("done", result.endState.outcome)
                assertEquals("generated-flow", result.flow.id)
            }
        }

        addThreads(transitionThread, startThread)
        startThread.start()
        verifyThreads()
    }

    @TestTemplate
    fun `test player with defaults`() = runBlockingTest {
        val flow = player.start(simpleFlowString)
        player.inProgressState?.transition("Next")

        val result = flow.await()
        assertEquals("done", result.endState.outcome)
        assertEquals("generated-flow", result.flow.id)
    }

    @TestTemplate
    fun `test player released state`() = runBlockingTest {
        assertTrue(player.state is NotStartedState)
        player.release()
        assertTrue(player.state is ReleasedState)
        val exception = assertThrows(PlayerException::class.java) {
            player.start(simpleFlowString)
        }
        assertEquals("Runtime object has been released!", exception.message?.split("] ")?.get(1))
        // shouldn't throw
        player.release()
    }

    @TestTemplate
    fun `test unknown expression error`() {
        player.start(
            """
            {
              "id": "action-with-expression",
              "views": [
                {
                  "id": "action",
                  "type": "action",
                  "exp": "{{count}} = {{count}} + 1",
                  "label": {
                    "asset": {
                      "id": "action-label",
                      "type": "text",
                      "value": "Clicked {{count}} times"
                    }
                  }
                }
              ],
              "data": {
                "count": 0
              },
              "navigation": {
                "BEGIN": "FLOW_1",
                "FLOW_1": {
                  "startState": "ACTION_1",
                  "ACTION_1": {
                    "state_type": "ACTION",
                    "exp": [
                      "yoyo()"
                    ],
                    "transitions": {
                      "*": "VIEW_1"
                    }
                  },
                  "VIEW_1": {
                    "state_type": "VIEW",
                    "ref": "action",
                    "transitions": {
                      "*": "END_Done"
                    }
                  },
                  "END_Done": {
                    "state_type": "END",
                    "outcome": "done"
                  }
                }
              }
            }
            """.trimIndent()
        )

        assertTrue(player.state is ErrorState)
    }
}
