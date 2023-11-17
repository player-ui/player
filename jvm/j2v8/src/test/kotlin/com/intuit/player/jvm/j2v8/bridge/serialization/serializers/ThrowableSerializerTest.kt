package com.intuit.player.jvm.j2v8.bridge.serialization.serializers

import com.eclipsesource.v8.V8Object
import com.intuit.player.jvm.core.bridge.serialization.serializers.ThrowableSerializer
import com.intuit.player.jvm.core.bridge.serialization.serializers.ThrowableSerializer.SerializableStackTraceElement
import com.intuit.player.jvm.core.player.PlayerException
import com.intuit.player.jvm.j2v8.base.J2V8Test
import com.intuit.player.jvm.j2v8.bridge.serialization.format.decodeFromV8Value
import com.intuit.player.jvm.j2v8.extensions.evaluateInJSThreadBlocking
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

private inline fun currentStackTrace() = Exception().stackTrace

// TODO: This should be a core [RuntimeTest]
internal class ThrowableSerializerTest : J2V8Test() {

    @Test
    fun `JS Error is deserialized as PlayerException (using regex)`() {
        val error = format.v8.evaluateInJSThreadBlocking(runtime) {
            executeObjectScript("""(new Error("hello"))""")
        }
        val exception = format.decodeFromRuntimeValue(ThrowableSerializer(), error)

        assertTrue(exception is PlayerException)
        exception as PlayerException
        assertEquals("Error: hello", exception.message)
        assertEquals(
            """com.intuit.player.jvm.core.bridge.JSErrorException: Error: hello
	at .(<anonymous>:1)
""",
            exception.stackTraceToString()
        )
    }

    @Test
    fun `PlayerException is serialized as JS Error`() {
        val stackTraceElement = currentStackTrace().first()
        val className = stackTraceElement.className
        val methodName = stackTraceElement.methodName
        val fileName = stackTraceElement.fileName
        val lineNumber = stackTraceElement.lineNumber
        val serializableStackTraceElement = SerializableStackTraceElement(
            className,
            methodName,
            fileName,
            lineNumber
        )

        val exception = PlayerException("world")
        exception.stackTrace = arrayOf(stackTraceElement)
        val error = format.encodeToRuntimeValue(ThrowableSerializer(), exception)

        assertTrue(error is V8Object)
        error as V8Object

        error.evaluateInJSThreadBlocking(runtime) {
            assertEquals("world", error.get("message"))
            assertEquals(exception.stackTraceToString(), error.getString("stack"))

            assertEquals(true, error.get("serialized"))
            assertTrue(
                format.encodeToRuntimeValue(
                    SerializableStackTraceElement.serializer(),
                    serializableStackTraceElement,
                ).jsEquals(error.getArray("stackTrace").getObject(0))
            )
        }
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

        assertTrue(exception is PlayerException)
        exception as PlayerException
        assertEquals("hello world", exception.message)
        assertEquals(listOf(stackTraceElement), exception.stackTrace.toList())
        exception.printStackTrace()
    }

    @Test
    fun `PlayerException with cause`() {
        val stackTraceElement = currentStackTrace().first()
        val className = stackTraceElement.className
        val methodName = stackTraceElement.methodName
        val fileName = stackTraceElement.fileName
        val lineNumber = stackTraceElement.lineNumber
        val serializableStackTraceElement = SerializableStackTraceElement(
            className,
            methodName,
            fileName,
            lineNumber
        )

        val exception = PlayerException(
            "hello",
            PlayerException("world").apply {
                stackTrace = arrayOf(stackTraceElement)
            }
        ).apply {
            stackTrace = arrayOf(stackTraceElement)
        }

        val error = format.encodeToRuntimeValue(ThrowableSerializer(), exception)

        assertTrue(error is V8Object)
        error as V8Object

        error.evaluateInJSThreadBlocking(runtime) {
            assertEquals("hello", error.get("message"))
            assertEquals(exception.stackTraceToString(), error.getString("stack"))

            assertEquals(true, error.get("serialized"))
            assertTrue(
                format.encodeToRuntimeValue(
                    SerializableStackTraceElement.serializer(),
                    serializableStackTraceElement,
                ).jsEquals(error.getArray("stackTrace").getObject(0))
            )

            val cause = format.decodeFromV8Value<Throwable>(error.getObject("cause"))
            assertEquals("world", cause.message)
            assertEquals(exception.cause!!.stackTrace.toList(), cause.stackTrace.toList())
        }
    }
}
