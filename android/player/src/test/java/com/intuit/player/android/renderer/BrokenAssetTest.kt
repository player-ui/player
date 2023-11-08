package com.intuit.player.android.renderer

import android.content.Context
import android.widget.FrameLayout
import android.widget.LinearLayout
import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.AssetContext
import com.intuit.player.android.asset.StaleViewException
import com.intuit.player.android.utils.BrokenAsset
import com.intuit.player.android.utils.BrokenAsset.Companion.asset
import com.intuit.player.android.utils.TestAssetsPlugin
import com.intuit.player.jvm.core.player.PlayerException
import com.intuit.player.jvm.core.player.state.ErrorState
import com.intuit.player.jvm.utils.start
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith

@ExtendWith(MockKExtension::class)
internal class BrokenAssetTest {

    private val runtime = BrokenAsset.runtime

    @MockK
    lateinit var mockContext: Context

    val player: AndroidPlayer by lazy {
        AndroidPlayer(TestAssetsPlugin)
    }

    val baseContext by lazy {
        AssetContext(null, runtime.asset(), player, ::BrokenAsset)
    }

    @BeforeEach fun setup() {
        player.start(BrokenAsset.sampleFlow)
    }

    @Test
    fun `invalidate view should fail on first render`() {
        assertThrows<StaleViewException> {
            BrokenAsset(baseContext.copy(asset = runtime.asset(shouldFail = true))).render(mockContext)
        }
    }

    @Test
    fun `invalidate view should handle gracefully in a rehydrate (if asset renders properly the second time)`() {
        assertTrue(BrokenAsset(baseContext.copy(asset = runtime.asset(layout = BrokenAsset.Layout.Frame))).render(mockContext) is FrameLayout)
        assertTrue(BrokenAsset(baseContext.copy(asset = runtime.asset(layout = BrokenAsset.Layout.Linear))).render(mockContext) is LinearLayout)
    }

    @Test
    fun `manual rehydration should fail the player on invalidate view`() {
        BrokenAsset(baseContext.copy(asset = runtime.asset(layout = BrokenAsset.Layout.Frame))).apply {
            assertTrue(render(mockContext) is FrameLayout)
            data.layout = BrokenAsset.Layout.Linear
            rehydrate()
        }
        assertTrue(player.state is ErrorState)
    }

    @Test
    fun `cannot render without a context`() {
        assertEquals(
            "Android context not found! Ensure the asset is rendered with a valid Android context.",
            assertThrows<PlayerException> {
                BrokenAsset(baseContext).requireContext()
            }.message
        )
        assertTrue(player.state is ErrorState)
    }
}
