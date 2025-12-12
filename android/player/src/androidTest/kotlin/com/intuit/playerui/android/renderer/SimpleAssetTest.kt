package com.intuit.playerui.android.renderer

import android.widget.TextView
import androidx.test.runner.AndroidJUnit4
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.R
import com.intuit.playerui.android.utils.SimpleAsset
import com.intuit.playerui.android.utils.SimpleAsset.Companion.sampleFlow
import com.intuit.playerui.android.utils.stringify
import com.intuit.playerui.android.withContext
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
internal class SimpleAssetTest : BaseRenderableAssetTest() {
    override val asset get() = SimpleAsset.sampleAsset

    override val assetContext: AssetContext by lazy {
        AssetContext(appContext, asset, player, ::SimpleAsset)
    }

    @Test
    fun `test rendering with no styles`() {
        val simple = SimpleAsset(assetContext).render(appContext)
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles`() {
        val simple = SimpleAsset(assetContext.withContext(appContext)).run {
            render(R.style.Theme_AppCompat)
        }
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles using another render method`() {
        val simple = SimpleAsset(assetContext.withContext(appContext)).run {
            render(listOf(R.style.Theme_AppCompat))
        }
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles and a tag`() {
        val simple = SimpleAsset(assetContext.withContext(appContext)).run {
            render(R.style.Theme_AppCompat, tag = "tag")
        }
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles and a tag using another render method`() {
        val simple = SimpleAsset(assetContext.withContext(appContext)).run {
            render(listOf(R.style.Theme_AppCompat), "tag")
        }
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with tag`() {
        player.start(sampleFlow.stringify())

        val asset = SimpleAsset(assetContext.withContext(appContext))

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
