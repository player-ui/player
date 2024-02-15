package com.intuit.playerui.core.asset

import com.intuit.playerui.core.NodeBaseTest
import com.intuit.playerui.core.player.PlayerException
import io.mockk.every
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class AssetTest : NodeBaseTest() {

    companion object {
        const val ID = "testId"
        const val TYPE = "testType"
    }

    val asset by lazy {
        Asset(node)
    }

    @BeforeEach
    fun setup() {
        every { node.nativeReferenceEquals(any()) } returns false
        every { node.getObject(any()) } returns node
        every { node.getSerializable<String>("id", any()) } returns ID
        every { node.getSerializable<String>("type", any()) } returns TYPE
    }

    @Test
    fun testId() {
        every { node.getString("id") } returns ID
        assertEquals(ID, asset.id)
    }

    @Test
    fun testType() {
        every { node.getString("type") } returns TYPE
        assertEquals(TYPE, asset.type)
    }

    @Test
    fun testDestructuring() {
        val (id, type) = asset
        assertEquals(ID, id)
        assertEquals(TYPE, type)
    }

    @Test
    fun testIdNotPresent() {
        assertThrows(PlayerException::class.java) {
            every { node.getSerializable<String>("id", any()) } returns null
            asset.id
        }
    }

    @Test
    fun testTypeNotPresent() {
        assertThrows(PlayerException::class.java) {
            every { node.getSerializable<String>("type", any()) } returns null
            asset.type
        }
    }

    @Test
    fun testDestructuringNotPresent() {
        assertThrows(PlayerException::class.java) {
            every { node.getSerializable<String>("id", any()) } returns null
            every { node.getSerializable<String>("type", any()) } returns null
            val (id, type) = asset
        }
    }
}
