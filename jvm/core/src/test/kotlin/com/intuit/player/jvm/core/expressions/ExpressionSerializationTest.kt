package com.intuit.player.jvm.core.expressions

import com.intuit.player.jvm.core.bridge.runtime.serialize
import com.intuit.player.jvm.core.bridge.serialization.format.decodeFromRuntimeValue
import com.intuit.player.jvm.core.bridge.serialization.format.encodeToRuntimeValue
import com.intuit.player.jvm.utils.test.RuntimeTest
import kotlinx.serialization.Serializable
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.TestTemplate

internal class ExpressionSerializationTest : RuntimeTest() {

    private val singleString = "some expression"
    private val single = Expression.Single(singleString)
    private val genericSingleString = "generic expression"
    private val genericSingle: Expression = Expression.Single(genericSingleString)
    private val collectionArray = listOf("one expression", "another expression")
    private val collection = Expression.Collection(collectionArray.strings)
    private val genericCollectionArray = listOf("vararg expression", "another vararg expression")
    private val genericCollection: Expression = Expression.Collection(*genericCollectionArray.strings.toTypedArray())

    private val List<*>.strings get() = filterIsInstance<String>()

    @TestTemplate
    fun `test ExpressionType to the runtime using explicit generic serializers`() {
        assertEquals(singleString, runtime.serialize(Expression.serializer(), single))
        assertEquals(genericSingleString, runtime.serialize(Expression.serializer(), genericSingle))
        assertEquals(collectionArray, runtime.serialize(Expression.serializer(), collection))
        assertEquals(genericCollectionArray, runtime.serialize(Expression.serializer(), genericCollection))
    }

    @TestTemplate
    fun `test ExpressionType to the runtime using explicit specific serializers`() {
        assertEquals(singleString, runtime.serialize(Expression.Single.serializer(), single))
        assertEquals(collectionArray, runtime.serialize(Expression.Collection.serializer(), collection))
    }

    @TestTemplate
    fun `test ExpressionType to the runtime using annotated serializers`() {
        assertEquals(singleString, runtime.serialize(Expression.Single.serializer(), single))
        assertEquals(genericSingleString, runtime.serialize(Expression.serializer(), genericSingle))
        assertEquals(collectionArray, runtime.serialize(Expression.Collection.serializer(), collection))
        assertEquals(genericCollectionArray, runtime.serialize(Expression.serializer(), genericCollection))
    }

    @Serializable
    private data class ExprWrapper(
        val expression: Expression.Single,
        val genericExpression: Expression,
        val expressions: Expression.Collection,
        val genericExpressions: Expression,
    )

    private val wrapper = ExprWrapper(
        single,
        genericSingle,
        collection,
        genericCollection,
    )

    @TestTemplate
    fun `test ExpressionType from the runtime into a wrapper class`() {
        val node = runtime.format.encodeToRuntimeValue(
            mapOf(
                "expression" to single.expression,
                "genericExpression" to (genericSingle as Expression.Single).expression,
                "expressions" to collection.expressions,
                "genericExpressions" to (genericCollection as Expression.Collection).expressions,
            ),
        )

        val wrapper = format.decodeFromRuntimeValue(ExprWrapper.serializer(), node)
        assertEquals(single, wrapper.expression)
        assertEquals(genericSingle, wrapper.genericExpression)
        assertEquals(collection, wrapper.expressions)
        assertEquals(genericCollection, wrapper.genericExpressions)
    }

    @TestTemplate
    fun `test ExpressionType to the runtime from a wrapper class`() {
        assertEquals(
            runtime.serialize(
                mapOf(
                    "expression" to single.expression,
                    "genericExpression" to (genericSingle as Expression.Single).expression,
                    "expressions" to collection.expressions,
                    "genericExpressions" to (genericCollection as Expression.Collection).expressions,
                ),
            ),
            runtime.serialize(ExprWrapper.serializer(), wrapper),
        )
    }
}
