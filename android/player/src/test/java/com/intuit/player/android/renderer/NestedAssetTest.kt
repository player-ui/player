package com.intuit.player.android.renderer

import android.widget.LinearLayout
import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.AssetContext
import com.intuit.player.android.utils.NestedAsset
import com.intuit.player.android.utils.SimpleAsset
import com.intuit.player.android.utils.awaitFirstView
import com.intuit.player.jvm.utils.test.runBlockingTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

internal class NestedAssetTest : BaseRenderableAssetTest() {

    override val asset get() = NestedAsset.sampleAsset

    override val player get() = AndroidPlayer(beaconPlugin).apply {
        registerAsset("simple", ::SimpleAsset)
        registerAsset("nested", ::NestedAsset)
    }

    override val assetContext: AssetContext by lazy {
        AssetContext(mockContext, asset, player, ::NestedAsset)
    }

    @Test
    fun `tested nested asset constructs`() {
        val nested = NestedAsset(assetContext).render(mockContext)
        assertTrue(nested is LinearLayout)
    }

    @Test
    fun `test nested asset context`() = runBlockingTest {
        val asset = player.awaitFirstView(NestedAsset.sampleFlow)!! as NestedAsset
        asset.render(mockContext)
        assertEquals(mockContext, NestedAsset.dummy?.context)
        NestedAsset.dummy2?.forEach {
            assertEquals(mockContext, it?.context)
        } ?: Unit
    }
}
