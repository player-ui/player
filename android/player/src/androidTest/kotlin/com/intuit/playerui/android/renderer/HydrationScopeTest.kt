package com.intuit.playerui.android.renderer

import android.view.View
import android.widget.TextView
import androidx.test.runner.AndroidJUnit4
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.runtimeFactory
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializer
import com.intuit.playerui.core.flow.forceTransition
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.plugins.coroutines.flowScope
import com.intuit.playerui.utils.makeFlow
import com.intuit.playerui.utils.start
import com.intuit.playerui.utils.test.runBlockingTest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json.Default.encodeToString
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
internal class HydrationScopeTest : BaseRenderableAssetTest() {
    private var completed: Boolean = false

    inner class TestAsset(
        assetContext: AssetContext,
    ) : RenderableAsset<Node>(assetContext, NodeSerializer()) {
        override suspend fun initView(data: Node): View = TextView(context)

        override suspend fun CoroutineScope.hydrate(view: View, data: Node) {
            launch {
                delay(500)
                completed = true
            }
        }

        val currentHydrationScope get() = hydrationScope
    }

    override val asset: Asset = runtimeFactory.create().serialize(
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
        AssetContext(appContext, asset, player, ::TestAsset)
    }

    @Before
    fun setup() {
        // Need to start flow for flowScope to be valid
        player.start(makeFlow(encodeToString(NodeSerializer(), asset)))
    }

    @Test
    fun `test cancelling hydration scope does not cancel flow scope`() = runBlocking {
        val test = TestAsset(assetContext)
        test.awaitRender(appContext)
        val hydrationScope = test.currentHydrationScope
        assertTrue(hydrationScope.isActive)
        assertTrue(player.flowScope!!.isActive)

        // hydrationScope is a SupervisorJob child of flowScope — cancelling it must not propagate up
        hydrationScope.cancel("cancelled by test")
        assertFalse(hydrationScope.isActive)
        assertTrue(player.flowScope!!.isActive)
    }

    @Test
    fun `test hydration scope can launch coroutines`() = runBlocking {
        val test = TestAsset(assetContext)
        test.awaitRender(appContext)
        waitForCompleted()
    }

    @Test
    fun `test existing hydration scope is cancelled on re-render`() = runBlocking {
        val test = TestAsset(assetContext)
        test.awaitRender(appContext)
        val currentHydrationScope = test.currentHydrationScope
        assertTrue(currentHydrationScope.isActive)
        player.recycle()
        test.awaitRender(appContext)
        assertFalse(currentHydrationScope.isActive)
    }

    @Test
    fun `test hydration scope is refreshed on re-render`() = runBlocking {
        val test = TestAsset(assetContext)
        test.awaitRender(appContext)
        val firstHydrationScope = test.currentHydrationScope
        assertTrue(firstHydrationScope.isActive)
        player.recycle()
        test.awaitRender(appContext)
        val secondHydrationScope = test.currentHydrationScope
        assertTrue(secondHydrationScope.isActive)
        assertFalse(firstHydrationScope.isActive)
        assertNotEquals(firstHydrationScope, secondHydrationScope)
    }

    @Test
    fun `test hydration scope is cancelled on flow end`() = runBlocking {
        val test = TestAsset(assetContext)
        test.awaitRender(appContext)
        player.inProgressState?.forceTransition("")
        waitForCondition { !player.flowScope!!.isActive }
        assertFalse(player.flowScope!!.isActive)
        assertFalse(test.currentHydrationScope.isActive)
        assertFalse(completed)
    }

    @Test
    fun `test hydration scope is cancelled on player release`() = runBlocking {
        val test = TestAsset(assetContext)
        test.awaitRender(appContext)
        player.release()
        waitForCondition { !player.flowScope!!.isActive }
        assertFalse(player.flowScope!!.isActive)
        assertFalse(test.currentHydrationScope.isActive)
        assertFalse(completed)
    }

    private fun waitForCompleted(count: Int = 5, delay: Long = 500) {
        waitForCondition(count, delay) { completed }
    }

    private fun waitForCondition(
        count: Int = 5,
        delay: Long = 500,
        conditions: () -> Boolean = { true },
    ) {
        var counter = 0
        while (!conditions() && counter++ < count) runBlockingTest { delay(delay) }
        assertTrue(conditions())
    }
}
