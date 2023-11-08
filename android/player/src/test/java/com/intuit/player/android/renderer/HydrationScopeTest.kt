package com.intuit.player.android.renderer

import android.view.View
import android.widget.TextView
import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.AssetContext
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.runtime.serialize
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializer
import com.intuit.player.jvm.core.flow.forceTransition
import com.intuit.player.jvm.core.player.state.inProgressState
import com.intuit.player.jvm.j2v8.bridge.runtime.J2V8
import com.intuit.player.jvm.utils.makeFlow
import com.intuit.player.jvm.utils.start
import com.intuit.player.jvm.utils.test.runBlockingTest
import com.intuit.player.plugins.coroutines.flowScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json.Default.encodeToString
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class HydrationScopeTest : BaseRenderableAssetTest() {

    private var completed: Boolean = false

    @Suppress("DEPRECATION_ERROR")
    inner class TestAsset(assetContext: AssetContext) : RenderableAsset(assetContext) {
        override fun initView(): View = TextView(context)

        override fun View.hydrate() {
            hydrationScope.launch {
                delay(500)
                completed = true
            }
        }

        val currentHydrationScope get() = hydrationScope
    }

    override val asset: Asset = J2V8.create().serialize(
        mapOf(
            "id" to "some-id",
            "type" to "test",
        )
    ) as Asset

    override val player by lazy {
        AndroidPlayer().apply {
            registerAsset("test", ::TestAsset)
        }
    }

    override val assetContext: AssetContext by lazy {
        AssetContext(mockContext, asset, player, ::TestAsset)
    }

    @BeforeEach fun setup() {
        // Need to start flow for flowScope to be valid
        player.start(makeFlow(encodeToString(NodeSerializer(), asset)))
    }

    @Test
    fun `test hydration scope can launch coroutines`() {
        val test = TestAsset(assetContext)
        test.render(mockContext)
        waitForCompleted()
    }

    @Test
    fun `test existing hydration scope is cancelled on re-render`() {
        val test = TestAsset(assetContext)
        test.render(mockContext)
        val currentHydrationScope = test.currentHydrationScope
        assertTrue(currentHydrationScope.isActive)
        player.recycle()
        test.render(mockContext)
        assertFalse(currentHydrationScope.isActive)
    }

    @Test
    fun `test hydration scope is refreshed on re-render`() {
        val test = TestAsset(assetContext)
        test.render(mockContext)
        val firstHydrationScope = test.currentHydrationScope
        assertTrue(firstHydrationScope.isActive)
        player.recycle()
        test.render(mockContext)
        val secondHydrationScope = test.currentHydrationScope
        assertTrue(secondHydrationScope.isActive)
        assertFalse(firstHydrationScope.isActive)
        assertNotEquals(firstHydrationScope, secondHydrationScope)
    }

    @Test
    fun `test hydration scope is cancelled on flow end`() {
        val test = TestAsset(assetContext)
        test.render(mockContext)
        player.inProgressState?.forceTransition("")
        assertFalse(player.flowScope!!.isActive)
        assertFalse(test.currentHydrationScope.isActive)
        assertFalse(completed)
    }

    @Test
    fun `test hydration scope is cancelled on player release`() {
        val test = TestAsset(assetContext)
        test.render(mockContext)
        player.release()
        assertFalse(player.flowScope!!.isActive)
        assertFalse(test.currentHydrationScope.isActive)
        assertFalse(completed)
    }

    private fun waitForCompleted(count: Int = 5, delay: Long = 500) {
        waitForCondition(count, delay) { completed }
    }

    private fun waitForCondition(count: Int = 5, delay: Long = 500, conditions: () -> Boolean = { true }) {
        var counter = 0
        while (!conditions() && counter++ < count) runBlockingTest { delay(delay) }
        assertTrue(conditions())
    }
}
