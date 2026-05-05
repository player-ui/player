package com.intuit.playerui.android.renderer

import android.widget.TextView
import androidx.test.runner.AndroidJUnit4
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.R
import com.intuit.playerui.android.build
import com.intuit.playerui.android.utils.SimpleAsset
import com.intuit.playerui.android.utils.SimpleAsset.Companion.sampleFlow
import com.intuit.playerui.android.utils.stringify
import com.intuit.playerui.android.withContext
import com.intuit.playerui.android.withStyles
import com.intuit.playerui.android.withTag
import kotlinx.coroutines.runBlocking
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
    fun `test rendering with no styles`() = runBlocking {
        val simple = SimpleAsset(assetContext).awaitRender(appContext)
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles`() = runBlocking {
        val simple = assetContext.withContext(appContext).withStyles(R.style.Theme_AppCompat).build().awaitRender(appContext)
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles using another render method`() = runBlocking {
        val simple = assetContext.withContext(appContext).withStyles(listOf(R.style.Theme_AppCompat)).build().awaitRender(appContext)
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles and a tag`() = runBlocking {
        val simple = assetContext.withContext(appContext).withStyles(R.style.Theme_AppCompat).withTag("tag").build().awaitRender(appContext)
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with some styles and a tag using another render method`() = runBlocking {
        val simple = assetContext.withContext(appContext).withStyles(listOf(R.style.Theme_AppCompat)).withTag("tag").build().awaitRender(appContext)
        assertTrue(simple is TextView)
    }

    @Test
    fun `test rendering with tag`() = runBlocking {
        player.start(sampleFlow.stringify())

        val firstView = assetContext.withContext(appContext).build().awaitRender(appContext)
        assertTrue(firstView is TextView)

        val secondView = assetContext.withContext(appContext).withTag("tag").build().awaitRender(appContext)
        assertTrue(secondView is TextView)

        assertEquals(secondView, assetContext.withContext(appContext).withTag("tag").build().awaitRender(appContext))
        assertNotEquals(firstView, secondView)
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
