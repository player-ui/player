package com.intuit.player.android.registry

import com.intuit.player.android.renderer.BaseRenderableAssetTest
import com.intuit.player.android.utils.OtherSimpleAsset
import com.intuit.player.android.utils.SimpleAsset
import com.intuit.player.android.utils.awaitFirstView
import com.intuit.player.jvm.utils.test.runBlockingTest
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

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
