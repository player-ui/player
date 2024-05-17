package com.intuit.playerui.core.serialization

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.Function1Serializer
import com.intuit.playerui.utils.test.RuntimeTest
import kotlinx.serialization.Polymorphic
import kotlinx.serialization.Serializable
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.TestTemplate

@Serializable
data class SomeData(
    val name: String,
    val node: Node,
    val genericInvokable: Invokable<@Polymorphic Any?>,
    val specificInvokable: (Int, String) -> Int,
    val specificInvokableWithNode: (Node) -> Map<String, @Polymorphic Any?>,
    @Serializable(with = Function1Serializer::class)
    val specificNonPrimitiveInvokable: (String) -> SomeDataWithDefaults?,
    val maybeGenericInvokable: Invokable<@Polymorphic Any?>? = null,
    val maybeNode: Node? = null,
)

@Serializable
data class SomeDataWithDefaults(
    val name: String = "default",
)

internal class NodeSerializationTest : RuntimeTest() {

    private val name get() = "some name"
    private val node get() = runtime.serialize(mapOf("hello" to "world")) as Node
    private val genericInvokable: Invokable<Any?> get() = Invokable { p1 -> println(p1); 2 }
    private val specificInvokable: (Int, String) -> Int get() = { p1, p2 -> println("p1: $p1; p2: $p2"); 3 }
    private val specificInvokableWithNode: (Node) -> Map<String, *> get() = { p1 -> println(p1); p1 }
    private val specificNonPrimitiveInvokable: (String) -> SomeDataWithDefaults? get() = {
        SomeDataWithDefaults(it)
    }

    @TestTemplate
    fun `serializes node wrappers`() {
        val someData = SomeData(
            name,
            node,
            genericInvokable,
            specificInvokable,
            specificInvokableWithNode,
            { null },
            null,
            null,
        )

        val someDataObj = runtime.serialize(someData) as Node
        assertEquals(name, someDataObj["name"])
        assertEquals(node, someDataObj["node"])

        assertNotEquals(genericInvokable, someDataObj["genericInvokable"])
        assertEquals(2, someDataObj.getInvokable<Int>("genericInvokable")?.invoke())

        assertNotEquals(specificInvokable, someDataObj["specificInvokable"])
        assertEquals(3, someDataObj.getInvokable<Int>("specificInvokable")?.invoke(2, "three"))

        val param = mapOf("wut" to "where")
        assertNotEquals(specificInvokableWithNode, someDataObj["specificInvokableWithNode"])
        assertEquals(param, someDataObj.getInvokable<Node>("specificInvokableWithNode")?.invoke(param))

        assertNull(someDataObj["maybeGenericInvokable"])
        assertNull(someDataObj["maybeNode"])
    }

    @TestTemplate
    fun `deserializes node wrappers`() {
        val someDataObj = runtime.serialize(
            mapOf(
                "name" to name,
                "node" to node,
                "genericInvokable" to genericInvokable,
                "specificInvokableWithNode" to specificInvokableWithNode,
                "specificNonPrimitiveInvokable" to specificNonPrimitiveInvokable,
                "specificInvokable" to specificInvokable,
            ),
        ) as Node
        val someData = someDataObj.deserialize(SomeData.serializer()) as SomeData
        assertEquals(name, someData.name)
        assertEquals(node, someData.node)

        assertNotEquals(genericInvokable, someData.genericInvokable)
        assertEquals(2, someData.genericInvokable())

        assertNotEquals(specificInvokable, someData.specificInvokable)
        assertEquals(3, someData.specificInvokable(2, "three"))

        val param = runtime.serialize(mapOf("wut" to "where")) as Node
        assertNotEquals(specificInvokableWithNode, someData.specificInvokableWithNode)
        assertEquals(param, someData.specificInvokableWithNode(param))

        assertNull(someData.maybeGenericInvokable)
        assertNull(someData.maybeNode)

        val function = someData.specificNonPrimitiveInvokable
        val data = function.invoke("Foo")

        assertEquals(SomeDataWithDefaults("Foo"), data)
    }

    @TestTemplate
    fun `handles undefined`() {
        val someDataObj = runtime.serialize(
            mapOf(
                "name" to name,
                "node" to node,
                "genericInvokable" to genericInvokable,
                "specificInvokableWithNode" to specificInvokableWithNode,
                "specificInvokable" to specificInvokable,
                "specificNonPrimitiveInvokable" to specificNonPrimitiveInvokable,
                "maybeNode" to Unit,
            ),
        ) as Node

        val someData = someDataObj.deserialize(SomeData.serializer()) as SomeData
        assertNull(someData.maybeNode)
    }

    @TestTemplate fun `can use default value`() {
        val someDataObj = runtime.serialize(
            mapOf(
                "name" to Unit,
            ),
        ) as Node

        val someData = someDataObj.deserialize(SomeDataWithDefaults.serializer())
        assertEquals("default", someData.name)
    }
}
