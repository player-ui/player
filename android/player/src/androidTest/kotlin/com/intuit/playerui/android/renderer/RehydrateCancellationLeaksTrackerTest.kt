package com.intuit.playerui.android.renderer

import android.content.Context
import android.util.Log
import androidx.test.core.app.ApplicationProvider
import androidx.test.runner.AndroidJUnit4
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.asyncHydrationTrackerPlugin
import com.intuit.playerui.android.utils.CoroutineTestDispatcherRule
import com.intuit.playerui.android.utils.SimpleAsset
import com.intuit.playerui.android.utils.SlowAsset
import com.intuit.playerui.android.utils.SlowAsset.Companion.asset
import com.intuit.playerui.android.utils.SlowParentAsset
import com.intuit.playerui.android.utils.TestAssetsPlugin
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.utils.start
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch

/**
 * Reproduces a second bug adjacent to the AssetRenderException-swallows-cancellation fix: the
 * rehydrate branch in RenderableAsset.render() (`!cachedAssetContext.asset.nativeReferenceEquals`)
 * only calls `asyncHydrationTrackerPlugin.renderingComplete(...)` inside its `try`/`catch
 * (StaleViewException)` bodies — NOT in a `finally`. If `rehydrate(cachedView)` throws a
 * CancellationException instead (e.g. because a second rehydrate for the same asset id cancelled
 * the hydrationScope this one is suspended in), `renderingComplete` never runs, so that asset id
 * is never removed from the tracker's `pending` set. `onHydrationComplete` — which
 * IdlingResourcePlugin waits on via Espresso's waitForIdleSync() — then never fires again for that
 * flow, hanging until IdlingResourceTimeoutException.
 *
 * Note: `pending` is a plain `Set<String>` keyed by `assetContext.id`. If the *same* id later
 * succeeds and calls `renderingComplete` normally, its own `pending.remove(id)` will incidentally
 * also clear the earlier leaked entry for that same id — masking the leak. To observe it for
 * real, this test uses a SECOND, independent sibling child (a different asset id) that hydrates
 * normally after the first child's rehydrate is cancelled and leaked: if the leak is real,
 * `pending` still contains the first child's id even after the sibling drains its own, so
 * `pending` never reaches empty and `onHydrationComplete` never fires again.
 *
 * To engage the real race, the child render() calls must be genuine structured children of a
 * *parent's* hydrationScope (same shape as RenderCancellationTest) — a bare top-level `async {}`
 * calling child.render() directly is NOT a child of any hydrationScope, so cancelling that scope
 * never reaches it. This drives two successive `parent.rehydrate()` calls (each swapping in a new
 * child instance before rehydrating), so the second rehydrate's renewHydrationScope() cancels the
 * `hydrationScope.launch { child.render() }` coroutine the first rehydrate's inflate() launched.
 *
 * The stall itself happens inside Data's deserialization (see SlowAsset.Data.SlowSerializer),
 * which runs on Dispatchers.Default via RenderableAsset.getData() — genuinely suspending render()'s
 * rehydrate branch before it ever reaches `withContext(Dispatchers.Main)`. Robolectric's Main
 * dispatcher routes through one single dedicated "Main Thread", so blocking there (e.g. inside
 * hydrate()) would deadlock any other coroutine's own withContext(Dispatchers.Main) call.
 * Dispatchers.Default has multiple worker threads, so blocking one there doesn't starve others.
 */
@RunWith(AndroidJUnit4::class)
internal class RehydrateCancellationLeaksTrackerTest {
    @get:Rule
    val coroutineRule = CoroutineTestDispatcherRule()
    private val runtime = SlowParentAsset.runtime

    val appContext: Context = ApplicationProvider.getApplicationContext()

    val player: AndroidPlayer by lazy {
        AndroidPlayer(TestAssetsPlugin)
    }

    val parentContext by lazy {
        AssetContext(appContext, SlowParentAsset.sampleAsset, player, ::SlowParentAsset)
    }

    fun childContext(revision: Int) =
        AssetContext(appContext, runtime.asset(revision = revision), player, ::SlowAsset)

    val siblingContext by lazy {
        AssetContext(appContext, SimpleAsset.sampleAsset, player, ::SimpleAsset)
    }

    /** A different-revision copy of the sibling asset, to force it through the rehydrate branch too. */
    val siblingRehydratedContext by lazy {
        val rehydratedMap = SimpleAsset.sampleMap + mapOf("data" to "{{otherBinding}}")
        AssetContext(appContext, runtime.serialize(rehydratedMap) as com.intuit.playerui.core.asset.Asset, player, ::SimpleAsset)
    }

    @Before
    fun setup() {
        player.start(SlowParentAsset.sampleFlow)
        SlowAsset.slowInInitView = false
        SlowAsset.slowInGetData = false
        SlowAsset.hydrateStarted = CompletableDeferred()
        SlowAsset.neverCompletesLatch = CountDownLatch(1)
    }

    @Test
    fun `a rehydrate cancelled by a second rehydrate should still drain the hydration tracker's pending set`() = runBlocking {
        val parent = SlowParentAsset(parentContext)
        parent.child = SlowAsset(childContext(revision = 0))
        parent.sibling = SimpleAsset(siblingContext)

        // Fully render the parent + both children once (fast — slowInGetData false), so the
        // parent has a cached view/hydrationScope and both children have cached views.
        parent.render()
        delay(200)

        val trackerHooks = player.asyncHydrationTrackerPlugin!!.hooks
        var hydrationCompleteCount = 0
        trackerHooks.onHydrationComplete.tap("test") { hydrationCompleteCount++ }

        // Swap in a new `child` instance whose Data deserialization stalls, then rehydrate the
        // parent — this re-runs the parent's hydrate(), which calls inflate(child, view) again,
        // launching hydrationScope.launch { child.render() } into the parent's (freshly renewed)
        // hydrationScope. The child's render() takes the rehydrate branch (a view is already
        // cached for this id) and blocks inside getData() -> Data.SlowSerializer.deserialize().
        // `sibling` is left unchanged, so it re-hydrates instantly (same native asset reference,
        // hits the `else` branch — a no-op re-track/complete pair).
        SlowAsset.slowInGetData = true
        SlowAsset.hydrateStarted = CompletableDeferred()
        parent.child = SlowAsset(childContext(revision = 1))
        parent.rehydrate()

        SlowAsset.hydrateStarted!!.await()
        Log.e("REHYDRATE_LEAK_DEBUG", "first child rehydrate is now blocked in Data deserialization")

        // Rehydrate the parent AGAIN, but WITHOUT touching `child` this time
        // (skipChildOnNextHydrate) — only `sibling` gets re-inflated. This still renews the
        // parent's hydrationScope, cancelling the in-flight `launch { child.render() }` coroutine
        // the first rehydrate created (still blocked in deserialization), but crucially does NOT
        // start a second, competing successful render for the "slow-asset" id — which would
        // otherwise call its own renderingComplete() and incidentally mask whether the *cancelled*
        // rehydrate's renderingComplete() was actually skipped.
        parent.skipChildOnNextHydrate = true
        parent.rehydrate()
        delay(200)

        // Release the first child rehydrate's blocked deserialize() — by now its hydrationScope
        // should already be cancelled by the second rehydrate's renewHydrationScope(), so
        // resuming should throw CancellationException right where it's blocked (or shortly after).
        SlowAsset.neverCompletesLatch.countDown()
        delay(500)

        Log.e("REHYDRATE_LEAK_DEBUG", "after child rehydrate race settled, hydrationCompleteCount=$hydrationCompleteCount")

        // Now independently rehydrate ONLY the sibling (different asset id, unrelated to the
        // child race above) with a genuinely different native asset reference, so it takes its
        // own rehydrate branch and completes normally end-to-end. skipChildOnNextHydrate ensures
        // `child` (already settled at revision=2) is NOT re-inflated here — otherwise its own
        // no-op re-track/complete pair would incidentally clear the leaked "slow-asset" entry too,
        // masking the bug this test is trying to catch.
        val newSibling = SimpleAsset(siblingRehydratedContext)
        parent.sibling = newSibling
        parent.skipChildOnNextHydrate = true
        parent.rehydrate()
        delay(300)

        Log.e("REHYDRATE_LEAK_DEBUG", "final hydrationCompleteCount=$hydrationCompleteCount")

        // BUG: if the child's cancelled rehydrate skipped renderingComplete() (no finally), its
        // asset id is permanently leaked in AsyncHydrationTrackerPlugin's `pending` set. The
        // sibling's own independent, successful rehydrate then can never bring `pending` back to
        // empty, so onHydrationComplete never fires again — even though the sibling's hydration
        // genuinely completed. IdlingResourcePlugin would hang forever on this flow as a result.
        assertTrue(
            "BUG REPRODUCED: onHydrationComplete never fired again after the sibling's " +
                "independent rehydrate completed — the earlier cancelled child rehydrate's " +
                "renderingComplete() call was skipped, permanently leaking its asset id in " +
                "AsyncHydrationTrackerPlugin's pending set and starving all future hydration-" +
                "complete signals for this flow. See RenderableAsset.render()'s rehydrate " +
                "branch, which only calls renderingComplete() from try/catch(StaleViewException) " +
                "bodies instead of a finally block.",
            hydrationCompleteCount > 1,
        )
    }
}
