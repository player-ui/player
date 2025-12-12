package com.intuit.playerui.android

import android.content.Context
import com.intuit.playerui.android.utils.ThrowingAsset.Companion.asset
import com.intuit.playerui.utils.start
import org.junit.Assert.assertThrows
import org.junit.Test
import com.intuit.playerui.android.asset.AssetRenderException
import com.intuit.playerui.android.utils.TestAssetsPlugin
import com.intuit.playerui.android.utils.ThrowingAsset
import io.mockk.impl.annotations.MockK
import io.mockk.junit4.MockKRule
import org.junit.Rule

internal class ThrowingAssetTest {
    @get:Rule
    val mockRule = MockKRule(this)

    private val runtime = ThrowingAsset.runtime

    @MockK
    lateinit var mockContext: Context

    val player: AndroidPlayer by lazy {
        AndroidPlayer(TestAssetsPlugin)
    }

    val baseContext by lazy {
        AssetContext(null, runtime.asset(), player, ::ThrowingAsset)
    }

//    @BeforeEach
//    fun setup() {
//        player.start(ThrowingAsset.sampleFlow)
//    }

//    @Test
//    fun `wrap throwable in an AssetRenderException`() {
//        assertEquals(1, 2)
//        assert(value = false)
//    }

    @Test
    fun `wrap throwable in an AssetRenderException2`() {
        player.start(ThrowingAsset.sampleFlow)
        assertThrows(AssetRenderException::class.java) {
            ThrowingAsset(baseContext.copy(asset = runtime.asset(value = 21))).render(mockContext)
        }
    }
}