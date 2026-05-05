package com.intuit.playerui.android.renderer

import android.content.Context
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.test.core.app.ApplicationProvider
import androidx.test.runner.AndroidJUnit4
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.AssetRenderException
import com.intuit.playerui.android.asset.StaleViewException
import com.intuit.playerui.android.utils.BrokenAsset
import com.intuit.playerui.android.utils.BrokenAsset.Companion.asset
import com.intuit.playerui.android.utils.TestAssetsPlugin
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.android.asset.asyncHydrationTrackerPlugin
import com.intuit.playerui.android.utils.CoroutineTestDispatcherRule
import com.intuit.playerui.utils.start
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
internal class BrokenAssetTest {
    @get:Rule
    val coroutineRule = CoroutineTestDispatcherRule()
    private val runtime = BrokenAsset.runtime

    val appContext: Context = ApplicationProvider.getApplicationContext()

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
    fun `invalidate view should fail on first render`() = runBlocking {
        var caught: AssetRenderException? = null
        try {
            BrokenAsset(baseContext.copy(asset = runtime.asset(shouldFail = true))).awaitRender(appContext)
        } catch (e: AssetRenderException) {
            caught = e
        }
        assertNotNull(caught)
        assertTrue(caught!!.cause is StaleViewException)
    }

    @Test
    fun `invalidate view should handle gracefully in a rehydrate (if asset renders properly the second time)`() = runBlocking {
        assertTrue(
            BrokenAsset(baseContext.copy(asset = runtime.asset(layout = BrokenAsset.Layout.Frame))).awaitRender(appContext) is FrameLayout,
        )
        assertTrue(
            BrokenAsset(baseContext.copy(asset = runtime.asset(layout = BrokenAsset.Layout.Linear))).awaitRender(appContext) is LinearLayout,
        )
    }

    @Test
    fun `manual rehydration should fail the player on invalidate view`() = runBlocking {
        BrokenAsset(baseContext.copy(asset = runtime.asset(layout = BrokenAsset.Layout.Frame))).apply {
            assertTrue(awaitRender(appContext) is FrameLayout)
            val rehydrationComplete = CompletableDeferred<Unit>()
            player.asyncHydrationTrackerPlugin!!.hooks.onHydrationComplete.tap("manual-rehydrate") {
                rehydrationComplete.complete(Unit)
            }
            data.layout = BrokenAsset.Layout.Linear
            rehydrate()
            rehydrationComplete.await()
        }
        assertTrue(player.state is ErrorState)
    }

    @Test
    fun `cannot render without a context`() {
        assertEquals(
            "Android context not found! Ensure the asset is rendered with a valid Android context.",
            org.junit.Assert.assertThrows(PlayerException::class.java) {
                BrokenAsset(baseContext).requireContext()
            }.message,
        )
        assertTrue(player.state is ErrorState)
    }
}
