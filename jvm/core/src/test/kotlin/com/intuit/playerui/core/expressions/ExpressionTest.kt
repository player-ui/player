package com.intuit.playerui.core.expressions

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.encodeToJsonElement
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class ExpressionTest {
    private val singleJson = JsonPrimitive("some expression")
    private val single = Expression.Single(singleJson.content)
    private val genericSingleJson = JsonPrimitive("generic expression")
    private val genericSingle: Expression = Expression.Single(genericSingleJson.content)
    private val collectionJson = buildJsonArray {
        add("one expression")
        add("another expression")
    }
    private val collection = Expression.Collection(collectionJson.map { it.jsonPrimitive.content })
    private val genericCollectionJson = buildJsonArray {
        add("vararg expression")
        add("another vararg expression")
    }
    private val genericCollection: Expression = Expression.Collection(
        *genericCollectionJson.map { it.jsonPrimitive.content }.toTypedArray(),
    )

    @Test
    fun `test ExpressionType to JSON using implicit serializer`() {
        /** Uses [Expression.Single.Serializer] */
        assertEquals(singleJson, Json.encodeToJsonElement(single))
        /** Uses [Expression.Serializer] */
        assertEquals(genericSingleJson, Json.encodeToJsonElement(genericSingle))
        /** Uses [Expression.Collection.Serializer] */
        assertEquals(collectionJson, Json.encodeToJsonElement(collection))
        /** Uses [Expression.Serializer] */
        assertEquals(genericCollectionJson, Json.encodeToJsonElement(genericCollection))
    }

    @Test
    fun `test ExpressionType to JSON using explicit generic serializers`() {
        assertEquals(singleJson, Json.encodeToJsonElement(Expression.Serializer, single))
        assertEquals(genericSingleJson, Json.encodeToJsonElement(Expression.Serializer, genericSingle))
        assertEquals(collectionJson, Json.encodeToJsonElement(Expression.Serializer, collection))
        assertEquals(genericCollectionJson, Json.encodeToJsonElement(Expression.Serializer, genericCollection))
    }

    @Test
    fun `test ExpressionType to JSON using explicit specific serializers`() {
        assertEquals(singleJson, Json.encodeToJsonElement(Expression.Single.Serializer, single))
        assertEquals(collectionJson, Json.encodeToJsonElement(Expression.Collection.Serializer, collection))
    }

    @Test
    fun `test ExpressionType to JSON using annotated serializers`() {
        assertEquals(singleJson, Json.encodeToJsonElement(Expression.Single.serializer(), single))
        assertEquals(genericSingleJson, Json.encodeToJsonElement(Expression.serializer(), genericSingle))
        assertEquals(collectionJson, Json.encodeToJsonElement(Expression.Collection.serializer(), collection))
        assertEquals(genericCollectionJson, Json.encodeToJsonElement(Expression.serializer(), genericCollection))
    }

    @Test
    fun `test ExpressionType from JSON using implicit serializer`() {
        /** Uses [Expression.Single.Serializer] */
        assertEquals(single, Json.decodeFromJsonElement<Expression.Single>(singleJson))
        /** Uses [Expression.Serializer] */
        assertEquals(genericSingle, Json.decodeFromJsonElement<Expression>(genericSingleJson))
        /** Uses [Expression.Collection.Serializer] */
        assertEquals(collection, Json.decodeFromJsonElement<Expression.Collection>(collectionJson))
        /** Uses [Expression.Serializer] */
        assertEquals(genericCollection, Json.decodeFromJsonElement<Expression>(genericCollectionJson))
    }

    @Test
    fun `test ExpressionType from JSON using explicit generic serializers`() {
        assertEquals(single, Json.decodeFromJsonElement(Expression.Serializer, singleJson))
        assertEquals(genericSingle, Json.decodeFromJsonElement(Expression.Serializer, genericSingleJson))
        assertEquals(collection, Json.decodeFromJsonElement(Expression.Serializer, collectionJson))
        assertEquals(genericCollection, Json.decodeFromJsonElement(Expression.Serializer, genericCollectionJson))
    }

    @Test
    fun `test ExpressionType from JSON using explicit specific serializers`() {
        assertEquals(single, Json.decodeFromJsonElement(Expression.Single.Serializer, singleJson))
        assertEquals(collection, Json.decodeFromJsonElement(Expression.Collection.Serializer, collectionJson))
    }

    @Test
    fun `test ExpressionType from JSON using annotated serializers`() {
        assertEquals(single, Json.decodeFromJsonElement(Expression.Single.serializer(), singleJson))
        assertEquals(genericSingle, Json.decodeFromJsonElement(Expression.serializer(), genericSingleJson))
        assertEquals(collection, Json.decodeFromJsonElement(Expression.Collection.serializer(), collectionJson))
        assertEquals(genericCollection, Json.decodeFromJsonElement(Expression.serializer(), genericCollectionJson))
    }
}
