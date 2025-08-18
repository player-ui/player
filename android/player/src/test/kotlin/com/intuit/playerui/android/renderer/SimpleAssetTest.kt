package com.intuit.playerui.android.renderer

import android.widget.TextView
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.R
import com.intuit.playerui.android.utils.SimpleAsset
import com.intuit.playerui.android.utils.SimpleAsset.Companion.sampleFlow
import com.intuit.playerui.android.utils.stringify
import com.intuit.playerui.android.withContext
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

internal class SimpleAssetTest : BaseRenderableAssetTest() {

    override val asset get() = SimpleAsset.sampleAsset

    override val assetContext: AssetContext by lazy {
        AssetContext(mockContext, asset, player, ::SimpleAsset)
    }

    @Test
    fun `test rendering with no styles`() {
        val simple = SimpleAsset(assetContext).render(mockContext)
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles`() {
        val simple = SimpleAsset(assetContext.withContext(mockContext)).run {
            render(R.style.TextAppearance_AppCompat)
        }
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles using another render method`() {
        val simple = SimpleAsset(assetContext.withContext(mockContext)).run {
            render(listOf(R.style.TextAppearance_AppCompat))
        }
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles and a tag`() {
        val simple = SimpleAsset(assetContext.withContext(mockContext)).run {
            render(R.style.TextAppearance_AppCompat, tag = "tag")
        }
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles and a tag using another render method`() {
        val simple = SimpleAsset(assetContext.withContext(mockContext)).run {
            render(listOf(R.style.TextAppearance_AppCompat), "tag")
        }
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with tag`() {
        player.start(sampleFlow.stringify())

        val asset = SimpleAsset(assetContext.withContext(mockContext))

        with(asset) {
            val firstView = asset.render()
            assertTrue(firstView is TextView)

            val secondView = asset.render("tag")
            assertTrue(secondView is TextView)

            assertEquals(secondView, asset.render("tag"))
            assertNotEquals(firstView, secondView)
        }
    }

    @Test
    fun `test beacon helper`() {
        val simple = SimpleAsset(assetContext)
        simple.beacon("viewed", "button")
        assertEquals(BeaconArgs("viewed", "button", asset), lastBeaconed)
    }

    @Test
    fun `test beacon helper with custom ID`() {
        val simple = SimpleAsset(assetContext)
        simple.beacon("viewed", "button", data = "custom-id")
        assertEquals(BeaconArgs("viewed", "button", asset, "custom-id"), lastBeaconed)
    }
}
