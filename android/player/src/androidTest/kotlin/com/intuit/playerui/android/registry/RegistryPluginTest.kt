package com.intuit.playerui.android.registry

import androidx.test.runner.AndroidJUnit4
import com.intuit.playerui.android.renderer.BaseRenderableAssetTest
import com.intuit.playerui.android.utils.OtherSimpleAsset
import com.intuit.playerui.android.utils.SimpleAsset
import com.intuit.playerui.android.utils.awaitFirstView
import com.intuit.playerui.utils.test.runBlockingTest
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
internal class RegistryPluginTest : BaseRenderableAssetTest() {
    override val asset get() = OtherSimpleAsset.sampleAsset

    @Test
    fun `partially match complex asset`() = runBlockingTest {
        assertTrue(player.awaitFirstView(OtherSimpleAsset.sampleFlow) is OtherSimpleAsset)
    }

    @Test fun `partially match simple asset`() = runBlockingTest {
        assertTrue(player.awaitFirstView(SimpleAsset.sampleFlow) is SimpleAsset)
    }
}
