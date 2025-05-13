package com.intuit.playerui.android.renderer

import android.view.View
import android.widget.TextView
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.DecodableAsset
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializer
import com.intuit.playerui.core.flow.forceTransition
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.j2v8.bridge.runtime.J2V8
import com.intuit.playerui.plugins.coroutines.flowScope
import com.intuit.playerui.utils.makeFlow
import com.intuit.playerui.utils.start
import com.intuit.playerui.utils.test.runBlockingTest
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json.Default.encodeToString
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class HydrationScopeTest : BaseRenderableAssetTest() {

    private var completed: Boolean = false

    inner class TestAsset(assetContext: AssetContext) : DecodableAsset<Node>(assetContext, NodeSerializer()) {
        override suspend fun initView(data: Node): View = TextView(context)

        override suspend fun View.hydrate(data: Node) {
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
        ),
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
    fun `test awaiting async view stub doesn't cancel parent scope`() = runBlocking {
        val test = TestAsset(assetContext)
        val asyncView = test.render(mockContext) as DecodableAsset.AsyncViewStub
        test.currentHydrationScope.cancel("hello")
        assertNull(asyncView.awaitView())
    }

    @Test
    fun `test hydration scope can launch coroutines`() = runBlocking {
        val test = TestAsset(assetContext)
        val asyncView = test.render(mockContext) as DecodableAsset.AsyncViewStub
        asyncView.awaitView()
        waitForCompleted()
    }

    @Test
    fun `test existing hydration scope is cancelled on re-render`() = runBlocking {
        val test = TestAsset(assetContext)
        test.render(mockContext)
        val currentHydrationScope = test.currentHydrationScope
        assertTrue(currentHydrationScope.isActive)
        player.recycle()
        test.render(mockContext)
        assertFalse(currentHydrationScope.isActive)
    }

    @Test
    fun `test hydration scope is refreshed on re-render`() = runBlocking {
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
    fun `test hydration scope is cancelled on flow end`() = runBlocking {
        val test = TestAsset(assetContext)
        test.render(mockContext)
        player.inProgressState?.forceTransition("")
        assertFalse(player.flowScope!!.isActive)
        assertFalse(test.currentHydrationScope.isActive)
        assertFalse(completed)
    }

    @Test
    fun `test hydration scope is cancelled on player release`() = runBlocking {
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
