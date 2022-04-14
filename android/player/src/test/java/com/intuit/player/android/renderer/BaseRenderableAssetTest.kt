package com.intuit.player.android.renderer

import android.content.Context
import android.widget.TextView
import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.AssetContext
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.android.utils.TestAssetsPlugin
import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.plugins.Plugin
import com.intuit.player.plugins.beacon.BeaconPlugin
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.spyk
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.extension.ExtendWith

@ExtendWith(MockKExtension::class)
internal abstract class BaseRenderableAssetTest {

    data class BeaconArgs(
        val action: String,
        val element: String,
        val asset: Asset,
        val data: Any? = null
    )

    var beaconPlugin: BeaconPlugin = spyk(BeaconPlugin())

    var beaconCount = 0; private set
    var lastBeaconed: BeaconArgs? = null; private set

    @BeforeEach
    fun mockBeaconPlugin() {
        every { beaconPlugin.beacon(any(), any(), any(), any()) } answers {
            val (action, element, asset, data) = args
            beaconCount++
            lastBeaconed = BeaconArgs(action as String, element as String, asset as Asset, data)
        }

        every { mockRenderableAsset.render(any()) } returns TextView(mockContext)
    }

    @MockK
    lateinit var mockContext: Context

    @MockK
    lateinit var mockRenderableAsset: RenderableAsset

    open val plugins: List<Plugin> by lazy {
        listOf(beaconPlugin, TestAssetsPlugin)
    }

    open val player by lazy {
        AndroidPlayer(plugins)
    }

    open val assetContext by lazy {
        AssetContext(mockContext, asset, player) { mockRenderableAsset }
    }

    abstract val asset: Asset
}
