package com.intuit.player.jvm.core.bridge.serialization.serializers

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.PlayerRuntimeException
import com.intuit.player.jvm.core.bridge.serialization.json.PrettyJson
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField.CacheStrategy
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField.Companion.NodeSerializableField
import com.intuit.player.jvm.core.player.PlayerException
import com.intuit.player.jvm.utils.test.RuntimeTest
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.assertThrows

@Serializable
data class Structured(
    val primitive: Int,
    val nested: Structured? = null,
)

@Serializable(Wrapper.Serializer::class)
class Wrapper(override val node: Node) : NodeWrapper {
    val nested: Structured by NodeSerializableField()
    val primitive: Int by NodeSerializableField()

    object Serializer : NodeWrapperSerializer<Wrapper>(::Wrapper)
}

internal class NodeSerializableFieldTest : RuntimeTest() {

    private val data = buildJsonObject {
        put("primitive", 10)
        put(
            "nested",
            buildJsonObject {
                put("primitive", 20)
            }
        )
    }

    lateinit var node: Node

    @BeforeEach
    fun setup() {
        runtime.execute("var data = ${PrettyJson.encodeToString(data)}")
        node = runtime.getObject("data") ?: error("data not defined")
    }

    @TestTemplate fun `default chooses no caching for primitive data`() {
        val delegate = NodeSerializableField<Int>({ node })
        assertEquals(CacheStrategy.None, delegate.strategy)

        val primitive by delegate
        assertEquals(10, primitive)
    }

    @TestTemplate fun `default chooses smart caching for structured data`() {
        val delegate = NodeSerializableField<Structured>({ node })
        assertEquals(CacheStrategy.Smart, delegate.strategy)

        val nested by delegate
        assertEquals(20, nested.primitive)
    }

    @TestTemplate fun `smart caching only re-deserializes when JS instances differ`() {
        val nested: Structured by NodeSerializableField({ node }, CacheStrategy.Smart)

        assertEquals(20, nested.primitive)
        assertSame(nested, nested)

        val inst = nested
        runtime.execute("data.nested = { primitive: 30 }")

        assertEquals(30, nested.primitive)
        assertNotSame(inst, nested)

        val primitive: Int by NodeSerializableField({ node }, CacheStrategy.Smart)
        assertEquals(10, primitive)

        // access check after runtime is released
        runtime.release()
        assertEquals("[$runtime] Runtime object has been released!", assertThrows<PlayerRuntimeException> { primitive }.message)
        assertEquals("[$runtime] Runtime object has been released!", assertThrows<PlayerRuntimeException> { nested }.message)
    }

    @TestTemplate fun `full caching doesn't re-access the JS layer`() {
        val nested: Structured by NodeSerializableField({ node }, CacheStrategy.Full)

        assertEquals(20, nested.primitive)
        assertSame(nested, nested)

        val inst = nested
        runtime.execute("data.nested = { primitive: 30 }")

        assertEquals(20, nested.primitive)
        assertSame(inst, nested)

        val primitive: Int by NodeSerializableField({ node }, CacheStrategy.Full)
        assertEquals(10, primitive)

        // access check after runtime is released
        runtime.release()
        assertEquals("[$runtime] Runtime object has been released!", assertThrows<PlayerRuntimeException> { primitive }.message)
        assertEquals("[$runtime] Runtime object has been released!", assertThrows<PlayerRuntimeException> { nested }.message)
    }

    @TestTemplate fun `no caching always re-deserializes`() {
        val nested: Structured by NodeSerializableField({ node }, CacheStrategy.None)

        assertEquals(20, nested.primitive)
        assertNotSame(nested, nested)

        val inst = nested
        runtime.execute("data.nested = { primitive: 30 }")

        assertEquals(30, nested.primitive)
        assertNotSame(inst, nested)

        val primitive: Int by NodeSerializableField({ node }, CacheStrategy.None)
        assertEquals(10, primitive)

        // access check after runtime is released
        runtime.release()
        assertEquals("[$runtime] Runtime object has been released!", assertThrows<PlayerRuntimeException> { primitive }.message)
        assertEquals("[$runtime] Runtime object has been released!", assertThrows<PlayerRuntimeException> { nested }.message)
    }

    @TestTemplate fun `throws when undefined`() {
        val nested: Structured by NodeSerializableField({ node }, name = "undefined")
        assertEquals(
            "Could not deserialize \"undefined\" as \"com.intuit.player.jvm.core.bridge.serialization.serializers.Structured(primitive: kotlin.Int, nested: com.intuit.player.jvm.core.bridge.serialization.serializers.Structured?)\"",
            assertThrows<PlayerException> {
                nested
            }.message
        )
    }

    @TestTemplate fun `node wrapper helpers automatically provide node`() {
        val wrapper: Wrapper by NodeSerializableField({ runtime }, name = "data")

        assertEquals(10, wrapper.primitive)
        assertEquals(20, wrapper.nested.primitive)
    }

    @TestTemplate fun `default value when non nullable returns null`() {
        val delegate = NodeSerializableField({ node }, defaultValue = { 100 })
        val noKeyEntry by delegate
        assertEquals(100, noKeyEntry)
    }

    @TestTemplate fun `JsonNull is unfortunately not handled automatically`() {
        var callCount = 0
        val json: JsonElement by NodeSerializableField({ runtime }) { callCount++; JsonNull }
        assertEquals(JsonNull, json)

        runtime.execute("var json = 20;")
        assertEquals(JsonPrimitive(20), json)

        runtime.execute("json = { hello: 'world' };")
        assertEquals(JsonObject(mapOf("hello" to JsonPrimitive("world"))), json)
        assertEquals(1, callCount)
    }
}
