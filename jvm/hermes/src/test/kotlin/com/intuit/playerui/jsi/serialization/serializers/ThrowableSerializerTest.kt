package com.intuit.playerui.jsi.serialization.serializers

import com.intuit.playerui.core.bridge.JSErrorException
import com.intuit.playerui.core.bridge.serialization.serializers.ThrowableSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.ThrowableSerializer.SerializableStackTraceElement
import com.intuit.playerui.core.error.ErrorSeverity
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.PlayerExceptionMetadata
import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.hermes.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.format.decodeFromValue
import com.intuit.playerui.utils.normalizeStackTraceElements
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import kotlin.test.currentStackTrace

private class ExceptionWithMetadata(
    message: String,
    cause: Throwable? = null,
) : PlayerException(message, cause),
    PlayerExceptionMetadata {
    override val type: String
        get() = "TestError"
    override val severity: ErrorSeverity?
        get() = ErrorSeverity.ERROR
    override val metadata: Map<String, Any?>?
        get() = mapOf(
            "testProperty" to "testValue",
        )
}

// TODO: This should be a core [RuntimeTest]
internal class ThrowableSerializerTest : HermesTest() {
    @Test
    fun `JS Error is deserialized as PlayerException (using regex)`() = runtime.evaluateInJSThreadBlocking {
        val error = runtime
            .global()
            .getPropertyAsFunction(runtime, "Error")
            .callAsConstructor(runtime, Value.from(runtime, "hello"))
        val exception = format.decodeFromRuntimeValue(ThrowableSerializer(), error)

        Assertions.assertTrue(exception is PlayerException)
        exception as PlayerException
        Assertions.assertEquals("Error: hello", exception.message)
        Assertions.assertEquals(
            """com.intuit.playerui.core.bridge.JSErrorException: Error: hello
""",
            exception.stackTraceToString(),
        )
    }

    @Test
    fun `JS Error is deserialized as PlayerException (with additional metadata)`() = runtime.evaluateInJSThreadBlocking {
        val error = runtime
            .global()
            .getPropertyAsFunction(runtime, "Error")
            .callAsConstructor(runtime, Value.from(runtime, "hello"))

        error.asObject(runtime).setProperty(runtime, "type", Value.from(runtime, "ErrorType"))
        error.asObject(runtime).setProperty(runtime, "severity", Value.from(runtime, "error"))
        error.asObject(runtime).setProperty(runtime, "metadata", Value.createFromJsonUtf8(runtime, "{\"testProperty\":\"testValue\"}"))
        val exception = format.decodeFromRuntimeValue(ThrowableSerializer(), error)

        Assertions.assertTrue(exception is JSErrorException)
        exception as JSErrorException
        Assertions.assertEquals("Error: hello", exception.message)
        Assertions.assertEquals(
            """com.intuit.playerui.core.bridge.JSErrorException: Error: hello
""",
            exception.stackTraceToString(),
        )
        Assertions.assertEquals("ErrorType", exception.type)
        Assertions.assertEquals(ErrorSeverity.ERROR, exception.severity)
        Assertions.assertEquals(mapOf("testProperty" to "testValue"), exception.metadata)
    }

    @Test
    fun `PlayerException is serialized as JS Error`() = runtime.evaluateInJSThreadBlocking {
        val stackTraceElement = currentStackTrace().first()
        val className = stackTraceElement.className
        val methodName = stackTraceElement.methodName
        val fileName = stackTraceElement.fileName
        val lineNumber = stackTraceElement.lineNumber
        val serializableStackTraceElement = SerializableStackTraceElement(
            className,
            methodName,
            fileName,
            lineNumber,
        )

        val exception = PlayerException("world")
        exception.stackTrace = arrayOf(stackTraceElement)
        val error = format.encodeToRuntimeValue(ThrowableSerializer(), exception).asObject(runtime)
        Assertions.assertEquals("world", error.getProperty(runtime, "message").asString(runtime))
        Assertions.assertEquals(exception.stackTraceToString(), error.getProperty(runtime, "stack").asString(runtime))

        Assertions.assertEquals(true, error.getProperty(runtime, "serialized").asBoolean())
        Assertions.assertEquals(
            serializableStackTraceElement,
            format.decodeFromValue<SerializableStackTraceElement>(
                error.getPropertyAsObject(runtime, "stackTrace").asArray(runtime).getValueAtIndex(runtime, 0),
            ),
        )
    }

    @Test
    fun `Additional PlayerExceptionMetadata is serialized into JS Error`() = runtime.evaluateInJSThreadBlocking {
        val stackTraceElement = currentStackTrace().first()
        val className = stackTraceElement.className
        val methodName = stackTraceElement.methodName
        val fileName = stackTraceElement.fileName
        val lineNumber = stackTraceElement.lineNumber
        val serializableStackTraceElement = SerializableStackTraceElement(
            className,
            methodName,
            fileName,
            lineNumber,
        )

        val exception = ExceptionWithMetadata("world")
        exception.stackTrace = arrayOf(stackTraceElement)
        val error = format.encodeToRuntimeValue(ThrowableSerializer(), exception).asObject(runtime)
        Assertions.assertEquals("world", error.getProperty(runtime, "message").asString(runtime))
        Assertions.assertEquals(exception.stackTraceToString(), error.getProperty(runtime, "stack").asString(runtime))

        Assertions.assertEquals(true, error.getProperty(runtime, "serialized").asBoolean())
        Assertions.assertEquals(
            serializableStackTraceElement,
            format.decodeFromValue<SerializableStackTraceElement>(
                error.getPropertyAsObject(runtime, "stackTrace").asArray(runtime).getValueAtIndex(runtime, 0),
            ),
        )

        Assertions.assertEquals(ErrorSeverity.ERROR.value, error.getProperty(runtime, "severity").asString(runtime))
        Assertions.assertEquals("TestError", error.getProperty(runtime, "type").asString(runtime))
        Assertions.assertEquals(
            "testValue",
            error.getPropertyAsObject(runtime, "metadata").getProperty(runtime, "testProperty").asString(runtime),
        )
    }

    @Test
    fun `JS Error is deserialized as PlayerException using serialized stack`() {
        val stackTraceElement = currentStackTrace().first()

        val error = format.encodeToRuntimeValue(
            PlayerException.serializer(),
            PlayerException("hello world").apply {
                stackTrace = arrayOf(stackTraceElement)
            },
        )
        val exception = format.decodeFromRuntimeValue(PlayerException.serializer(), error)

        Assertions.assertEquals("hello world", exception.message)
        Assertions.assertEquals(
            arrayOf(stackTraceElement).normalizeStackTraceElements(),
            exception.stackTrace.normalizeStackTraceElements(),
        )
        exception.printStackTrace()
    }

    @Test
    fun `PlayerException with cause`() = runtime.evaluateInJSThreadBlocking {
        val stackTraceElement = currentStackTrace().first()
        val className = stackTraceElement.className
        val methodName = stackTraceElement.methodName
        val fileName = stackTraceElement.fileName
        val lineNumber = stackTraceElement.lineNumber
        val serializableStackTraceElement = SerializableStackTraceElement(
            className,
            methodName,
            fileName,
            lineNumber,
        )

        val exception = PlayerException(
            "hello",
            PlayerException("world").apply {
                stackTrace = arrayOf(stackTraceElement)
            },
        ).apply {
            stackTrace = arrayOf(stackTraceElement)
        }

        val error = format.encodeToRuntimeValue(ThrowableSerializer(), exception).asObject(runtime)

        Assertions.assertEquals("hello", error.getProperty(runtime, "message").asString(runtime))
        Assertions.assertEquals(exception.stackTraceToString(), error.getProperty(runtime, "stack").asString(runtime))

        Assertions.assertEquals(true, error.getProperty(runtime, "serialized").asBoolean())
        Assertions.assertEquals(
            serializableStackTraceElement,
            format.decodeFromValue<SerializableStackTraceElement>(
                error.getPropertyAsObject(runtime, "stackTrace").asArray(runtime).getValueAtIndex(runtime, 0),
            ),
        )

        val cause = format.decodeFromValue<Throwable>(error.getProperty(runtime, "cause"))
        Assertions.assertEquals("world", cause.message)
        Assertions.assertEquals(
            exception.cause!!.stackTrace.normalizeStackTraceElements(),
            cause.stackTrace.normalizeStackTraceElements(),
        )
    }
}
