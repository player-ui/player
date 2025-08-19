package com.intuit.playerui.android

import android.content.Context
import android.view.View
import android.widget.TextView
import androidx.test.platform.app.InstrumentationRegistry
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.MapBackedNode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import androidx.test.runner.AndroidJUnit4

@RunWith(AndroidJUnit4::class)
class AssetContextAndroidTest {

    private val context: Context get() =
        InstrumentationRegistry.getInstrumentation().targetContext

    private val player by lazy { AndroidPlayer() }

    private fun Map<String, Any?>.toAsset(): Asset = MapBackedNode(this).let(::Asset)

    private val assetMap = mapOf("id" to "first", "type" to "rando")

    @Suppress("DEPRECATION_ERROR")
    private fun renderableAsset(assetContext: AssetContext) = object : RenderableAsset(assetContext) {
        override fun initView() = TextView(context)
        override fun View.hydrate() = Unit
    }

    private val assetContext by lazy {
        AssetContext(context, assetMap.toAsset(), player, ::renderableAsset)
    }

    @Test
    fun testAssetContextEquality() {
        assertEquals(assetContext, assetContext)
    }

    @Test
    fun testMapEquality() {
        assertTrue(mapOf("id" to "first", "type" to "rando") == mapOf("id" to "first", "type" to "rando"))
        assertTrue(MapBackedNode(mapOf("id" to "first", "type" to "rando")) == MapBackedNode(mapOf("id" to "first", "type" to "rando")))
        assertTrue(mapOf("id" to "first", "type" to "rando").toAsset() == mapOf("id" to "first", "type" to "rando").toAsset())
    }

    @Test
    fun testAssetContextAssetEquality() {
        assertTrue(assetContext == assetContext.copy(asset = assetContext.asset))
        assertTrue(assetContext == assetContext.copy(asset = assetMap.toAsset()))
        assertFalse(assetContext == assetContext.copy(asset = (assetMap + mapOf("id" to "second")).toAsset()))
    }

    @Test
    fun testAssetContextPlayerEquality() {
        assertTrue(assetContext == assetContext.copy(player = assetContext.player))
        assertFalse(assetContext == assetContext.copy(player = AndroidPlayer()))
    }

    @Test
    fun testAssetContextContextEquality() {
        assertTrue(assetContext == assetContext.withContext(context))
        assertFalse(assetContext == assetContext.withStyles(R.style.TextAppearance_AppCompat))
    }
}
