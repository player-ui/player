package com.intuit.playerui.android.renderer

import android.content.Context
import android.util.Log
import androidx.test.core.app.ApplicationProvider
import androidx.test.runner.AndroidJUnit4
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.AssetRenderException
import com.intuit.playerui.android.utils.CoroutineTestDispatcherRule
import com.intuit.playerui.android.utils.SlowAsset
import com.intuit.playerui.android.utils.SlowAsset.Companion.asset
import com.intuit.playerui.android.utils.SlowParentAsset
import com.intuit.playerui.android.utils.TestAssetsPlugin
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.utils.start
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Reproduces a real bug in RenderableAsset.render(): a parent's hydrate() calls
 * `inflate(child, container)`, which does `hydrationScope.launch { child.render() }` — the
 * child's *entire* render() call is a structured child of the *parent's* hydrationScope. If the
 * parent is rehydrated while that inner `child.render()` coroutine is still suspended deep inside
 * its own body (e.g. mid-initView(), on Dispatchers.Default), the parent's renewHydrationScope()
 * cancels the parent's old hydrationScope — which cancels the in-flight `launch { child.render() }`
 * coroutine, delivering a CancellationException *inside* the child's own render() call stack.
 *
 * doRender()'s inner catch already special-cases CancellationException and rethrows it as-is. But
 * render()'s outer `catch (exception: Throwable)` — which wraps doRender() from the outside too —
 * does not special-case CancellationException, so it wraps it into
 * AssetRenderException("Failed to render asset") instead. Since `inflateChild`'s
 * `hydrationScope.launch { child.render() }` has no try/catch of its own, that exception escapes
 * into the player's top-level coroutine exception handler, which treats it as a real, fatal error
 * and fails the whole flow — confirmed live below via `[ErrorController] Captured error: Failed to
 * render asset` / `player.state becoming ErrorState`. An ordinary superseded-by-a-rehydrate race —
 * which should be silent, exactly like it already is for doRender()'s own inner catch — instead
 * ends the entire flow. This matches a production stack trace where a background inflateChild()
 * render() call raced a rehydrate for the same asset id.
 */
@RunWith(AndroidJUnit4::class)
internal class RenderCancellationTest {
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

    val childContext by lazy {
        AssetContext(appContext, runtime.asset(), player, ::SlowAsset)
    }

    @Before
    fun setup() {
        player.start(SlowParentAsset.sampleFlow)
        SlowAsset.hydrateStarted = CompletableDeferred()
        SlowAsset.neverCompletes = CompletableDeferred()
    }

    @Test
    fun `rehydrating a parent while its child's render() call is still suspended should not surface the child's cancellation as AssetRenderException`() = runBlocking {
        val parent = SlowParentAsset(parentContext)
        parent.child = SlowAsset(childContext)

        // Kick off the parent's first render directly. Its hydrate() calls inflate(child, view),
        // which does hydrationScope.launch { child.render() } — the child's render() call becomes
        // a structured child of the *parent's* hydrationScope, and immediately suspends inside
        // its own initView().
        var parentCaught: Throwable? = null
        val parentRender = async {
            try {
                parent.render()
            } catch (e: Throwable) {
                parentCaught = e
                Log.e("RENDER_CANCEL_DEBUG", "parent's first render() threw: $e")
            }
        }

        SlowAsset.hydrateStarted!!.await()
        val firstParentScope = parent.currentHydrationScope
        Log.e("RENDER_CANCEL_DEBUG", "child initView() started, parent scope active=${firstParentScope.isActive}")
        assertTrue("parent's hydrationScope should be active before rehydrate", firstParentScope.isActive)

        // Rehydrate the parent — renewHydrationScope() cancels the parent's OLD hydrationScope,
        // which cancels the in-flight `launch { child.render() }` coroutine while the child is
        // still suspended inside its own render() body (in initView(), awaiting neverCompletes).
        parent.rehydrate()

        // Let the cancellation propagate and the child's render() catch block run.
        delay(500)

        Log.e("RENDER_CANCEL_DEBUG", "after rehydrate: firstParentScope.isActive=${firstParentScope.isActive} parentCaught=$parentCaught")

        // Unblock the child's initView() in case it's still somehow suspended, so the test
        // doesn't hang regardless of how the race resolved, then let the parent's own first
        // render() call finish.
        SlowAsset.neverCompletes.complete(Unit)
        parentRender.await()

        assertTrue(
            "Expected the parent's original hydrationScope to be cancelled by rehydrate() " +
                "(parentCaught=$parentCaught) — the race never engaged",
            !firstParentScope.isActive,
        )

        // BUG: an ordinary superseded-by-a-rehydrate race on the in-flight child render() call
        // should be silent (same as doRender()'s own inner catch already special-cases
        // CancellationException and lets it propagate as-is) — but render()'s outer catch wraps
        // it into AssetRenderException("Failed to render asset") instead, which escapes
        // inflateChild()'s unguarded `launch { child.render() }` straight into the player's
        // top-level coroutine exception handler, failing the entire flow.
        assertFalse(
            "BUG REPRODUCED: an ordinary parent-rehydrate-cancels-in-flight-child-render race " +
                "surfaced as a fatal AssetRenderException and put the player into ErrorState " +
                "(player.state=${player.state}), instead of being silently swallowed the way " +
                "doRender()'s own inner catch already does for CancellationException. See " +
                "RenderableAsset.render()'s outer catch (exception: Throwable) block, which — " +
                "unlike doRender()'s inner catch — does not special-case CancellationException.",
            player.state is ErrorState,
        )
    }
}
