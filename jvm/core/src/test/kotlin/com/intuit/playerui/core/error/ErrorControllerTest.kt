package com.intuit.playerui.core.error

import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.plugins.assets.ReferenceAssetsPlugin
import com.intuit.playerui.plugins.types.CommonTypesPlugin
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate

internal class ErrorControllerTest : PlayerTest() {
    override val plugins: List<Plugin> = listOf(ReferenceAssetsPlugin(), CommonTypesPlugin())

    private val simpleFlow =
        """
        {
          "id": "test-flow",
          "views": [
            {
              "id": "action",
              "type": "action",
              "value": "next",
              "label": {
                "asset": {
                  "id": "action-label",
                  "type": "text",
                  "value": "Next"
                }
              }
            }
          ],
          "data": {},
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
                "outcome": "done"
              }
            }
          }
        }
        """.trimIndent()

    @TestTemplate
    fun `error controller hook is called and onError hook exists`() = runBlockingTest {
        player.start(simpleFlow)
        val state = player.state as? InProgressState
        assertNotNull(state)

        val errorController = state?.controllers?.error
        assertNotNull(errorController)
        assertNotNull(errorController?.hooks?.onError)
    }

    @TestTemplate
    fun `capture error with all parameters`() = runBlockingTest {
        player.start(simpleFlow)

        val state = player.state as? InProgressState
        assertNotNull(state)

        val errorController = state?.controllers?.error
        assertNotNull(errorController)

        val testError = Exception("Not found")
        val capturedError = errorController?.captureError(
            testError,
            ErrorTypes.NETWORK,
            ErrorSeverity.ERROR,
            mapOf("url" to "https://example.com", "statusCode" to 404),
        )

        assertNotNull(capturedError)

        val errorInfo = capturedError?.let { PlayerErrorInfo(it) }
        assertEquals("Not found", errorInfo?.message)
        assertEquals(ErrorTypes.NETWORK, errorInfo?.errorType)
        assertEquals(ErrorSeverity.ERROR, errorInfo?.severity)
        assertNotNull(errorInfo?.metadata)
    }

    @TestTemplate
    fun `capture error with minimal parameters`() = runBlockingTest {
        player.start(simpleFlow)

        val state = player.state as? InProgressState
        val errorController = state?.controllers?.error
        assertNotNull(errorController)

        val testError = Exception("Internal error")
        val capturedError = errorController?.captureError(
            testError,
            ErrorTypes.PLUGIN,
        )

        assertNotNull(capturedError)

        val errorInfo = capturedError?.let { PlayerErrorInfo(it) }
        assertEquals("Internal error", errorInfo?.message)
        assertEquals(ErrorTypes.PLUGIN, errorInfo?.errorType)
        assertNull(errorInfo?.severity)
    }

    @TestTemplate
    fun `capture multiple errors with chronological history and current error updates`() = runBlockingTest {
        player.start(simpleFlow)

        val state = player.state as? InProgressState
        val errorController = state?.controllers?.error
        assertNotNull(errorController)

        // Capture first error
        errorController?.captureError(
            Exception("First error"),
            ErrorTypes.VALIDATION,
            ErrorSeverity.WARNING,
        )

        // Verify current error is the first one
        var currentError = errorController?.getCurrentError()
        assertEquals("First error", currentError?.let { PlayerErrorInfo(it).message })

        // Capture second error
        errorController?.captureError(
            Exception("Second error"),
            ErrorTypes.BINDING,
            ErrorSeverity.ERROR,
        )

        // Current error should be updated to the second one
        currentError = errorController?.getCurrentError()
        assertEquals("Second error", currentError?.let { PlayerErrorInfo(it).message })

        // Capture third error
        errorController?.captureError(
            Exception("Third error"),
            ErrorTypes.VIEW,
            ErrorSeverity.FATAL,
        )

        // Current error should be updated to the third one
        currentError = errorController?.getCurrentError()
        assertEquals("Third error", currentError?.let { PlayerErrorInfo(it).message })

        // Verify all errors are in chronological order
        val errors = errorController?.getErrors()
        assertNotNull(errors)
        assertEquals(3, errors?.size)

        val errorInfos = errors?.map { PlayerErrorInfo(it) }
        assertEquals("First error", errorInfos?.get(0)?.message)
        assertEquals("Second error", errorInfos?.get(1)?.message)
        assertEquals("Third error", errorInfos?.get(2)?.message)
    }

    @TestTemplate
    fun `get current error`() = runBlockingTest {
        player.start(simpleFlow)

        val state = player.state as? InProgressState
        val errorController = state?.controllers?.error
        assertNotNull(errorController)

        // Initially no current error
        var currentError = errorController?.getCurrentError()
        // In JS, getCurrentError returns undefined when no error, which becomes null in Kotlin
        assertTrue(currentError == null || currentError.isUndefined())

        // Capture an error
        errorController?.captureError(
            Exception("Current error"),
            ErrorTypes.DATA,
            ErrorSeverity.ERROR,
        )

        // Now should have a current error
        currentError = errorController?.getCurrentError()
        assertNotNull(currentError)
        assertFalse(currentError?.isUndefined() ?: true)

        val errorInfo = currentError?.let { PlayerErrorInfo(it) }
        assertEquals("Current error", errorInfo?.message)
        assertEquals(ErrorTypes.DATA, errorInfo?.errorType)
    }

    @TestTemplate
    fun `clear all errors`() = runBlockingTest {
        player.start(simpleFlow)

        val state = player.state as? InProgressState
        val errorController = state?.controllers?.error
        assertNotNull(errorController)

        // Capture multiple errors
        errorController?.captureError(
            Exception("Error 1"),
            ErrorTypes.VALIDATION,
        )
        errorController?.captureError(
            Exception("Error 2"),
            ErrorTypes.BINDING,
        )

        var errors = errorController?.getErrors()
        assertEquals(2, errors?.size)

        var currentError = errorController?.getCurrentError()
        assertNotNull(currentError)
        assertFalse(currentError?.isUndefined() ?: true)

        // Clear all errors
        errorController?.clearErrors()

        errors = errorController?.getErrors()
        assertTrue(errors?.isEmpty() ?: true)

        currentError = errorController?.getCurrentError()
        assertTrue(currentError == null || currentError.isUndefined())
    }

    @TestTemplate
    fun `clear current error preserves history`() = runBlockingTest {
        player.start(simpleFlow)

        val state = player.state as? InProgressState
        val errorController = state?.controllers?.error
        assertNotNull(errorController)

        // Capture multiple errors
        errorController?.captureError(
            Exception("Error 1"),
            ErrorTypes.VALIDATION,
        )
        errorController?.captureError(
            Exception("Error 2"),
            ErrorTypes.BINDING,
        )

        var errors = errorController?.getErrors()
        assertEquals(2, errors?.size)

        var currentError = errorController?.getCurrentError()
        assertNotNull(currentError)
        assertFalse(currentError?.isUndefined() ?: true)

        // Clear only current error
        errorController?.clearCurrentError()

        // History should be preserved
        errors = errorController?.getErrors()
        assertEquals(2, errors?.size)

        // Current error should be cleared
        currentError = errorController?.getCurrentError()
        assertTrue(currentError == null || currentError.isUndefined())
    }

    @TestTemplate
    fun `error controller accessible via controllers`() = runBlockingTest {
        player.start(simpleFlow)

        val state = player.state as? InProgressState
        assertNotNull(state)

        val controllers = state?.controllers
        assertNotNull(controllers)
        assertNotNull(controllers?.data)
        assertNotNull(controllers?.flow)
        assertNotNull(controllers?.view)
        assertNotNull(controllers?.expression)
        assertNotNull(controllers?.error)
    }
}
