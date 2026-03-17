package com.intuit.playerui.hermes.bridge

import com.intuit.playerui.core.bridge.PlayerRuntimeException
import com.intuit.playerui.hermes.base.HermesTest
import com.intuit.playerui.hermes.extensions.evaluateInJSThreadBlocking
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Value
import kotlinx.serialization.builtins.serializer
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

internal class HermesNodeReleasedObjectTest : HermesTest() {
    @Test
    fun `reading property from released JSI object throws PlayerRuntimeException`() {
        val obj = runtime.evaluateInJSThreadBlocking {
            Object(runtime).apply {
                setProperty(runtime, "x", Value.from(1))
            }
        }

        val node = HermesNode(obj, runtime)
        obj.release()

        val ex = assertThrows<PlayerRuntimeException> {
            node.getSerializable("x", Int.serializer())
        }

        assertTrue(!ex.message.isNullOrBlank())
    }
}
