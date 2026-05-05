package com.intuit.playerui.android.renderer

import android.content.Context
import android.view.View
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.asset.asyncHydrationTrackerPlugin
import com.intuit.playerui.android.build
import com.intuit.playerui.android.withContext
import kotlinx.coroutines.CompletableDeferred

/**
 * Renders this asset with the given [context] and suspends until the root view and all
 * async children have completed hydration.
 */
internal suspend fun RenderableAsset<*>.awaitRender(context: Context): View {
    val id = "${asset.id}:${asset.type}"
    val builtAsset = assetContext
        .withContext(player.hooks.context.call(context))
        .build()
    val hydrationComplete = CompletableDeferred<Unit>()
    player.asyncHydrationTrackerPlugin!!.hooks.onHydrationComplete.tap("awaitRender-${System.nanoTime()}") {
        hydrationComplete.complete(Unit)
    }
    val view = builtAsset.render(isRoot = true)
    hydrationComplete.await()
    return view
}
