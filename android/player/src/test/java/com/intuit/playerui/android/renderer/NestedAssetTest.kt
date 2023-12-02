package com.intuit.playerui.android.renderer

import android.widget.LinearLayout
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.SuspendableAsset
import com.intuit.playerui.android.utils.NestedAsset
import com.intuit.playerui.android.utils.SimpleAsset
import com.intuit.playerui.android.utils.awaitFirstView
import com.intuit.playerui.core.flow.Flow
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.utils.test.runBlockingTest
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

internal class NestedAssetTest : BaseRenderableAssetTest() {

    override val asset get() = NestedAsset.sampleAsset

    override val player get() = AndroidPlayer(beaconPlugin).apply {
        registerAsset("simple", ::SimpleAsset)
        registerAsset("nested", ::NestedAsset)
        val inProgressState = mockk<InProgressState>()
        every { inProgressState.flow } returns Flow()
        hooks.state.call(HashMap(), arrayOf(inProgressState))
    }

    override val assetContext: AssetContext by lazy {
        AssetContext(mockContext, asset, player, ::NestedAsset)
    }

    @Test
    fun `tested nested asset constructs`() = runBlocking {
        val nested = NestedAsset(assetContext).render(mockContext).let {
            if (it is SuspendableAsset.AsyncViewStub) it.awaitView() else it
        }
        assertTrue(nested is LinearLayout)
    }

    @Test
    fun `test nested asset context`() = runBlockingTest {
        val asset = player.awaitFirstView(NestedAsset.sampleFlow)!! as NestedAsset
        asset.render(mockContext).let {
            if (it is SuspendableAsset.AsyncViewStub) it.awaitView() else it
        }
        assertEquals(mockContext, NestedAsset.dummy?.context)
        NestedAsset.dummy2?.forEach {
            assertEquals(mockContext, it?.context)
        } ?: Unit
    }
}
