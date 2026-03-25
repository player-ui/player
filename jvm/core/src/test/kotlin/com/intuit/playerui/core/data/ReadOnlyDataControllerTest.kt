package com.intuit.playerui.core.data

import com.intuit.playerui.core.NodeBaseTest
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.format.RuntimeFormat
import io.mockk.every
import io.mockk.impl.annotations.MockK
import kotlinx.serialization.modules.EmptySerializersModule
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class ReadOnlyDataControllerTest : NodeBaseTest() {
    private val data: Map<String, Any?> = mapOf(
        "name" to "Player",
        "count" to 42,
    )

    private val readOnlyDataController by lazy {
        ReadOnlyDataController(node)
    }

    @MockK
    private lateinit var format: RuntimeFormat<*>

    @BeforeEach
    fun setUpMocks() {
        every { node.format } returns format
        every { format.serializersModule } returns EmptySerializersModule
        every { node.getInvokable<Any?>("get", any()) } returns Invokable { args ->
            val binding = args[0] as? String ?: return@Invokable null
            if (binding.isEmpty()) data else data[binding]
        }
    }

    @Test
    fun `get returns value for binding`() {
        assertEquals("Player", readOnlyDataController.get("name"))
        assertEquals(42, readOnlyDataController.get("count"))
    }

    @Test
    fun `get returns null for unknown binding`() {
        assertNull(readOnlyDataController.get("unknown"))
    }

    @Test
    fun `get convenience extension returns full data model`() {
        @Suppress("UNCHECKED_CAST")
        val result = readOnlyDataController.get()
        assertEquals("Player", result["name"])
        assertEquals(42, result["count"])
    }

    @Test
    fun `DataController inherits get from ReadOnlyDataController`() {
        every { node.getInvokable<Unit>("set", any()) } returns Invokable { }
        val dataController = DataController(node)
        assertTrue(dataController is ReadOnlyDataController)
        assertEquals("Player", dataController.get("name"))
    }

    @Test
    fun `DataController is a subtype of ReadOnlyDataController`() {
        every { node.getInvokable<Unit>("set", any()) } returns Invokable { }
        val dataController = DataController(node)
        // DataController must be assignable to ReadOnlyDataController so callers typed to the
        // base receive a DataController instance where the JS object supports set (in-progress),
        // or a plain ReadOnlyDataController where it does not (completed).
        assertTrue(dataController is ReadOnlyDataController)
        assertFalse(readOnlyDataController is DataController)
    }
}
