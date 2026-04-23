package com.intuit.playerui.core.error

import com.intuit.playerui.core.player.PlayerExceptionMetadata
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.plugins.assets.ReferenceAssetsPlugin
import com.intuit.playerui.plugins.types.CommonTypesPlugin
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestTemplate

private class ExceptionWithAnyMetadata(
    message: String,
    override val type: String,
    override val severity: ErrorSeverity? = null,
    override val metadata: Map<String, Any?>? = null,
) : Throwable(message),
    PlayerExceptionMetadata

internal class ErrorControllerTest : PlayerTest() {
    override val plugins: List<Plugin> = listOf(ReferenceAssetsPlugin(), CommonTypesPlugin())

    private lateinit var errorController: ErrorController

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

    @BeforeEach
    fun setup() = runBlockingTest {
        player.start(simpleFlow)
        val state = player.state as? InProgressState
        assertNotNull(state)
        errorController = state!!.controllers.error
    }

    @TestTemplate
    fun `error controller hook is called and onError hook exists`() {
        assertNotNull(errorController.hooks.onError)
    }

    @TestTemplate
    fun `capture error with all parameters`() {
        val testError = ExceptionWithAnyMetadata(
            "Not found",
            ErrorTypes.NETWORK.value,
            ErrorSeverity.ERROR,
            mapOf(
                "url" to "https://example.com",
                "statusCode" to 404,
            ),
        )
        val result = errorController.captureError(testError)

        assertEquals(result, false)

        val capturedError = errorController.getCurrentError()

        assertNotNull(capturedError)
        val errorInfo = capturedError?.let { it as PlayerExceptionMetadata }
        assertEquals("Not found", capturedError?.message)
        assertEquals(ErrorTypes.NETWORK.value, errorInfo?.type)
        assertEquals(ErrorSeverity.ERROR, errorInfo?.severity)
        assertNotNull(errorInfo?.metadata)
    }

    @TestTemplate
    fun `capture error with minimal parameters`() {
        val testError = ExceptionWithAnyMetadata("Internal error", ErrorTypes.PLUGIN.value)
        val result = errorController.captureError(testError)

        assertEquals(result, false)

        val capturedError = errorController.getCurrentError()

        assertNotNull(capturedError)
        val errorInfo = capturedError?.let { it as PlayerExceptionMetadata }
        assertEquals("Internal error", capturedError?.message)
        assertEquals(ErrorTypes.PLUGIN.value, errorInfo?.type)
        assertNull(errorInfo?.severity)
    }

    @TestTemplate
    fun `capture multiple errors with chronological history and current error updates`() {
        // Capture first error
        errorController.captureError(
            ExceptionWithAnyMetadata("First error", ErrorTypes.VALIDATION.value, ErrorSeverity.WARNING),
        )

        // Verify current error is the first one
        var currentError = errorController.getCurrentError()
        assertEquals("First error", currentError?.message)

        // Capture second error
        errorController.captureError(
            ExceptionWithAnyMetadata(
                "Second error",
                ErrorTypes.BINDING.value,
                ErrorSeverity.ERROR,
            ),
        )

        // Current error should be updated to the second one
        currentError = errorController.getCurrentError()
        assertEquals("Second error", currentError?.message)

        // Capture third error
        errorController.captureError(
            ExceptionWithAnyMetadata(
                "Third error",
                ErrorTypes.VIEW.value,
                ErrorSeverity.FATAL,
            ),
        )

        // Current error should be updated to the third one
        currentError = errorController.getCurrentError()
        assertEquals("Third error", currentError?.message)

        // Verify all errors are in chronological order
        val errors = errorController.getErrors()
        assertNotNull(errors)
        assertEquals(3, errors?.size)

        assertEquals("First error", errors?.get(0)?.message)
        assertEquals("Second error", errors?.get(1)?.message)
        assertEquals("Third error", errors?.get(2)?.message)
    }

    @TestTemplate
    fun `get current error`() {
        // Initially no current error
        val initialError = errorController.getCurrentError()
        assertNull(initialError)

        // Capture an error
        errorController.captureError(
            ExceptionWithAnyMetadata(
                "Current error",
                ErrorTypes.DATA.value,
                ErrorSeverity.ERROR,
            ),
        )

        // Now should have a current error
        val currentError = errorController.getCurrentError()
        assertNotNull(currentError)

        val errorInfo = currentError as PlayerExceptionMetadata?
        assertEquals("Current error", currentError?.message)
        assertEquals(ErrorTypes.DATA.value, errorInfo?.type)
    }

    @TestTemplate
    fun `clear all errors`() {
        // Capture multiple errors
        errorController.captureError(
            ExceptionWithAnyMetadata(
                "Error 1",
                ErrorTypes.VALIDATION.value,
            ),
        )
        errorController.captureError(
            ExceptionWithAnyMetadata(
                "Error 2",
                ErrorTypes.BINDING.value,
            ),
        )

        val errorsBeforeClear = errorController.getErrors()
        assertEquals(2, errorsBeforeClear?.size)

        val currentErrorBeforeClear = errorController.getCurrentError()
        assertNotNull(currentErrorBeforeClear)

        // Clear all errors
        errorController.clearErrors()

        val errorsAfterClear = errorController.getErrors()
        assertNotNull(errorsAfterClear)
        assertTrue(errorsAfterClear!!.isEmpty())

        val currentErrorAfterClear = errorController.getCurrentError()
        assertNull(currentErrorAfterClear)
    }

    @TestTemplate
    fun `clear current error preserves history`() {
        // Capture multiple errors
        errorController.captureError(
            ExceptionWithAnyMetadata(
                "Error 1",
                ErrorTypes.VALIDATION.value,
            ),
        )
        errorController.captureError(
            ExceptionWithAnyMetadata(
                "Error 2",
                ErrorTypes.BINDING.value,
            ),
        )

        val errorsBeforeClear = errorController.getErrors()
        assertEquals(2, errorsBeforeClear?.size)

        val currentErrorBeforeClear = errorController.getCurrentError()
        assertNotNull(currentErrorBeforeClear)

        // Clear only current error
        errorController.clearCurrentError()

        // History should be preserved
        val errorsAfterClear = errorController.getErrors()
        assertEquals(2, errorsAfterClear?.size)

        // Current error should be cleared
        val currentErrorAfterClear = errorController.getCurrentError()
        assertNull(currentErrorAfterClear)
    }

    @TestTemplate
    fun `error controller accessible via controllers`() {
        val state = player.state as InProgressState
        val controllers = state.controllers

        assertNotNull(controllers.data)
        assertNotNull(controllers.flow)
        assertNotNull(controllers.view)
        assertNotNull(controllers.expression)
        assertNotNull(controllers.error)
    }
}
