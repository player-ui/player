package com.intuit.player.android

import android.content.Context
import androidx.annotation.StyleRes
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.android.extensions.Style
import com.intuit.player.android.extensions.Styles
import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.player.PlayerException
import com.intuit.player.jvm.core.player.state.inProgressState

/** Structure containing all the information needed to render an [Asset]. */
public data class AssetContext(
    val context: Context?,

    /** Underlying [Asset] data structure */
    val asset: Asset,

    /**
     * [AndroidPlayer] instance that is rendering the [asset].
     * This provides access to the top-level APIs and plugins.
     */
    val player: AndroidPlayer,

    /** Internal factory method used to create new instances of the [RenderableAsset] */
    internal val factory: (AssetContext) -> RenderableAsset,

    val id: String,
) {

    public constructor(
        context: Context?,
        asset: Asset,
        player: AndroidPlayer,
        factory: (AssetContext) -> RenderableAsset,
    ) : this(context, asset, player, factory, asset.id)

    @Deprecated("Replacing with `with`-style builder calls", ReplaceWith("withTag(tag)", "com.intuit.player.android.AssetContext.withTag"))
    public fun postFixId(tag: String): AssetContext = withTag(tag)

    val type: String by lazy {
        asset.type
    }
}

public fun AssetContext.withTag(tag: String): AssetContext = copy(id = "$id-$tag")

public fun AssetContext.withContext(context: Context): AssetContext = copy(context = context)

/** Create a new, styled [AssetContext] */
public fun AssetContext.withStyles(@StyleRes vararg styles: Style?): AssetContext = withStyles(styles.filterNotNull())

/** Create a new, styled [AssetContext] */
public fun AssetContext.withStyles(@StyleRes styles: Styles): AssetContext = if (styles.isEmpty()) this else copy(
    context = context?.let { player.getCachedStyledContext(it, styles) } ?: run {
        val error = PlayerException("Android context not found! Ensure the asset is rendered with a valid Android context.")
        player.inProgressState?.fail(error)
        throw error
    }
)

public fun AssetContext.build(): RenderableAsset = factory(this)
