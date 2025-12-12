package com.intuit.playerui.android.renderer

import android.content.Context
import android.widget.TextView
import androidx.test.core.app.ApplicationProvider
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.utils.CoroutineTestDispatcherRule
import com.intuit.playerui.android.utils.TestAssetsPlugin
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.flow.Flow
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.plugins.beacon.BeaconPlugin
import io.mockk.coEvery
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit4.MockKRule
import io.mockk.mockk
import io.mockk.spyk
import org.junit.Before
import org.junit.Rule

internal abstract class BaseRenderableAssetTest {
    @get:Rule
    val mockKRule = MockKRule(this)

    @get:Rule
    val coroutineRule = CoroutineTestDispatcherRule()

    data class BeaconArgs(
        val action: String,
        val element: String,
        val asset: Asset,
        val data: Any? = null,
    )

    var beaconPlugin: BeaconPlugin = spyk(BeaconPlugin())

    var beaconCount = 0
        private set
    var lastBeaconed: BeaconArgs? = null
        private set

    @Before
    fun mockBeaconPlugin() {
        every { beaconPlugin.beacon(any(), any(), any(), any()) } answers {
            val (action, element, asset, data) = args
            beaconCount++
            lastBeaconed = BeaconArgs(action as String, element as String, asset as Asset, data)
        }

        coEvery { mockRenderableAsset.render(any()) } returns TextView(appContext)
    }

    val appContext: Context = ApplicationProvider.getApplicationContext()

    @MockK
    lateinit var mockRenderableAsset: RenderableAsset

    open val plugins: List<Plugin> by lazy {
        listOf(beaconPlugin, TestAssetsPlugin)
    }

    open val player by lazy {
        AndroidPlayer(plugins).apply {
            val inProgressState: InProgressState = mockk()
            every { inProgressState.flow } returns Flow(id = "fake-flow-test")
            hooks.state.call(HashMap(), arrayOf(inProgressState))
        }
    }

    open val assetContext by lazy {
        AssetContext(appContext, asset, player) { mockRenderableAsset }
    }

    abstract val asset: Asset
}
