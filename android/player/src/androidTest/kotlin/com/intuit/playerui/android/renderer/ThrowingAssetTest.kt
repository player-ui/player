package com.intuit.playerui.android.renderer

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.runner.AndroidJUnit4
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.AssetRenderException
import com.intuit.playerui.android.utils.TestAssetsPlugin
import com.intuit.playerui.android.utils.ThrowingAsset
import com.intuit.playerui.android.utils.ThrowingAsset.Companion.asset
import com.intuit.playerui.utils.start
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
internal class ThrowingAssetTest {
    private val runtime = ThrowingAsset.runtime

    val appContext: Context = ApplicationProvider.getApplicationContext()

    val player: AndroidPlayer by lazy {
        AndroidPlayer(TestAssetsPlugin)
    }

    val baseContext by lazy {
        AssetContext(appContext, runtime.asset(), player, ::ThrowingAsset)
    }

    @Test
    fun `wrap throwable in an AssetRenderException`() {
        player.start(ThrowingAsset.sampleFlow)
        assertThrows(AssetRenderException::class.java) {
            ThrowingAsset(baseContext.copy(asset = runtime.asset(value = 21)))
                .render(appContext)
        }
    }
}
