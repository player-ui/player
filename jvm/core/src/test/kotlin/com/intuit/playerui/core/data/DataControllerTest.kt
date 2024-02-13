package com.intuit.playerui.core.data

import com.intuit.playerui.core.NodeBaseTest
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.getInvokable
import io.mockk.every
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class DataControllerTest : NodeBaseTest() {

    var data: Map<String, Any?> = mapOf(
        "key" to "initial value",
    )
    private val dataController by lazy {
        DataController(node)
    }

    @BeforeEach
    fun setUpMocks() {
        every { node.getInvokable<Unit>("set") } returns Invokable { args ->
            val arg = args[0] as Map<String, Any?>
            data = data + arg.keys.map { it to arg[it] }
        }
    }

    @Test
    fun setInt() {
        assertEquals("initial value", data["key"])
        dataController.set(
            mapOf(
                "key2" to 2,
            ),
        )
        assertEquals(2, data["key2"])
        dataController.set(
            mapOf(
                "key" to "1",
            ),
        )
        assertEquals("1", data["key"])
        assertEquals(2, data["key2"])
    }
}
