package com.intuit.player.jvm.core.asset

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.player.PlayerException
import io.mockk.every
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test

internal class AssetTest : NodeBaseTest() {

    companion object {
        const val ID = "testId"
        const val TYPE = "testType"
    }

    val asset by lazy {
        Asset(node)
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
        every { node.getString("id") } returns ID
        every { node.getString("type") } returns TYPE

        val (id, type) = asset
        assertEquals(ID, id)
        assertEquals(TYPE, type)
    }

    @Test
    fun testIdNotPresent() {
        assertThrows(PlayerException::class.java) {
            every { node.getString("id") } returns null
            asset.id
        }
    }

    @Test
    fun testTypeNotPresent() {
        assertThrows(PlayerException::class.java) {
            every { node.getString("type") } returns null
            asset.type
        }
    }

    @Test
    fun testDestructuringNotPresent() {
        assertThrows(PlayerException::class.java) {
            every { node.getString("id") } returns null
            every { node.getString("type") } returns null
            val (id, type) = asset
        }
    }
}
