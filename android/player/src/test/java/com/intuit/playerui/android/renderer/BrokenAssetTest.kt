package com.intuit.playerui.android.renderer

import android.content.Context
import android.widget.FrameLayout
import android.widget.LinearLayout
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.StaleViewException
import com.intuit.playerui.android.utils.BrokenAsset
import com.intuit.playerui.android.utils.BrokenAsset.Companion.asset
import com.intuit.playerui.android.utils.TestAssetsPlugin
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.utils.start
import com.intuit.playerui.utils.test.runBlockingTest
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import kotlinx.coroutines.runBlocking
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
            runBlocking {
                BrokenAsset(baseContext.copy(asset = runtime.asset(shouldFail = true))).render(mockContext)
            }
        }
    }

    @Test
    fun `invalidate view should handle gracefully in a rehydrate (if asset renders properly the second time)`(): Unit = runBlockingTest {
        assertTrue(BrokenAsset(baseContext.copy(asset = runtime.asset(layout = BrokenAsset.Layout.Frame))).render(mockContext) is FrameLayout)
        assertTrue(BrokenAsset(baseContext.copy(asset = runtime.asset(layout = BrokenAsset.Layout.Linear))).render(mockContext) is LinearLayout)
    }

    @Test
    fun `manual rehydration should fail the player on invalidate view`(): Unit = runBlockingTest {
        BrokenAsset(baseContext.copy(asset = runtime.asset(layout = BrokenAsset.Layout.Frame))).apply {
            assertTrue(render(mockContext) is FrameLayout)
            getData().layout = BrokenAsset.Layout.Linear
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
            }.message,
        )
        assertTrue(player.state is ErrorState)
    }
}
