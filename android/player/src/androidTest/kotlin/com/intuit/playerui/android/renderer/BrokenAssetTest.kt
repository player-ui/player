package com.intuit.playerui.android.renderer

import android.content.Context
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.test.core.app.ApplicationProvider
import androidx.test.runner.AndroidJUnit4
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.StaleViewException
import com.intuit.playerui.android.utils.BrokenAsset
import com.intuit.playerui.android.utils.BrokenAsset.Companion.asset
import com.intuit.playerui.android.utils.TestAssetsPlugin
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.utils.start
import io.mockk.impl.annotations.MockK
import io.mockk.junit4.MockKRule
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
internal class BrokenAssetTest {
    @get:Rule
    val mockkrule = MockKRule(this)
    private val runtime = BrokenAsset.runtime

    @MockK
    lateinit var mockContext: Context

    val player: AndroidPlayer by lazy {
        AndroidPlayer(TestAssetsPlugin)
    }

    val baseContext by lazy {
        AssetContext(null, runtime.asset(), player, ::BrokenAsset)
    }

    @Before
    fun setup() {
        player.start(BrokenAsset.sampleFlow)
    }

    @Test
    fun `invalidate view should fail on first render`() {
        assertThrows(StaleViewException::class.java) {
            BrokenAsset(baseContext.copy(asset = runtime.asset(shouldFail = true))).render(mockContext)
        }
    }

    @Test
    fun `invalidate view should handle gracefully in a rehydrate (if asset renders properly the second time)`() {
        assertTrue(
            BrokenAsset(baseContext.copy(asset = runtime.asset(layout = BrokenAsset.Layout.Frame))).render(mockContext) is FrameLayout,
        )
        assertTrue(
            BrokenAsset(baseContext.copy(asset = runtime.asset(layout = BrokenAsset.Layout.Linear))).render(mockContext) is LinearLayout,
        )
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
            assertThrows(PlayerException::class.java) {
                BrokenAsset(baseContext).requireContext()
            }.message,
        )
        assertTrue(player.state is ErrorState)
    }
}
