package com.intuit.playerui.j2v8.extensions

import com.eclipsesource.v8.V8
import com.eclipsesource.v8.V8Function
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.j2v8.V8Function
import com.intuit.playerui.j2v8.base.J2V8Test
import com.intuit.playerui.j2v8.v8Object
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertNotNull

@Serializable
private data class TestSerializableClass(
    val testProp: String,
)

internal class InvokeTest : J2V8Test() {
    @Test
    fun `test V8Function vararg invoke`() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val func = v8.executeObjectScript("""(function(a,b){return a+b})""") as V8Function
            assertEquals(4, func.call(v8, format.args(2, 2)))
            assertEquals(4, func.invoke(format, 2, 2))
        }
    }

    @Test
    fun `test V8Function creation helper`() {
        v8.evaluateInJSThreadBlocking(runtime) {
            assertEquals(V8.getUndefined(), V8Function(format) { Unit }(this@InvokeTest.format))
            assertEquals(4, V8Function(format) { 2 + 2 }(this@InvokeTest.format))
        }
    }

    @Test
    fun `test nested serialization`() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val func = v8.executeObjectScript("""(function(){return [{ "testProp": "testValue" }]})""") as V8Function
            val invokable = func.toInvokable(format, v8Object, ListSerializer(TestSerializableClass.serializer()))

            assertNotNull(invokable)
            assertEquals(listOf(TestSerializableClass("testValue")), invokable.invoke())
        }
    }

    @Test
    fun `test unit`() {
        v8.evaluateInJSThreadBlocking(runtime) {
            val func = v8.executeObjectScript("""(function(){})""") as V8Function
            val invokable = func.toInvokable(format, v8Object, format.serializer<Unit>())

            assertNotNull(invokable)
            assertEquals(Unit, invokable.invoke())
        }
    }
}
