package com.intuit.playerui.android

import android.content.Context
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.utils.SimpleAsset
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.utils.start
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

internal class AssetContextTest {
    @MockK lateinit var context: Context

    @MockK lateinit var context2: Context
    private var asset = mockk<Asset>()
    private val player = AndroidPlayer()
    private var renderable = mockk<RenderableAsset>()
    private val factory = { _: AssetContext -> renderable }
    lateinit var assetContext: AssetContext

    @BeforeEach
    fun setup() {
        every { asset.id } returns "some-id"
        assetContext = AssetContext(
            context = context,
            asset = asset,
            player = player,
            factory = factory,
        )
    }

    @Test
    fun assetContext() {
        assertEquals(context, assetContext.context)
        assertEquals(asset, assetContext.asset)
        assertEquals("some-id", assetContext.id)
        assertEquals(player, assetContext.player)
        assertEquals(renderable, assetContext.factory.invoke(assetContext))
    }

    @Test
    fun assetContextHelpers() {
        val assetContext = AssetContext(
            context = context,
            asset = asset,
            player = player,
            factory = factory,
        )

        assertEquals(renderable, assetContext.build())
        assertEquals(assetContext, assetContext.withStyles())
        assertNotEquals(assetContext, assetContext.withContext(context2))
    }

    @Test
    fun postFixId() {
        val newContext = assetContext.withTag("tag")
        assertEquals("some-id-tag", newContext.id)
    }

    @Test
    fun `can't overlay styles without a context`() {
        val player = AndroidPlayer().apply {
            start(SimpleAsset.sampleFlow)
        }
        assertThrows<PlayerException> {
            AssetContext(null, asset, player, factory).withStyles(R.style.TextAppearance_AppCompat)
        }
        assertTrue(player.state is ErrorState)
    }
}
