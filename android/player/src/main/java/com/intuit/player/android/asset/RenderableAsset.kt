package com.intuit.player.android.asset

import android.content.Context
import android.view.View
import androidx.annotation.StyleRes
import com.intuit.player.android.*
import com.intuit.player.android.DEPRECATED_WITH_DECODABLEASSET
import com.intuit.player.android.extensions.Style
import com.intuit.player.android.extensions.Styles
import com.intuit.player.android.extensions.removeSelf
import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.asset.AssetWrapper
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.encoding.requireNodeDecoder
import com.intuit.player.jvm.core.player.Player
import com.intuit.player.jvm.core.player.PlayerException
import com.intuit.player.jvm.core.player.state.fail
import com.intuit.player.jvm.core.player.state.inProgressState
import com.intuit.player.plugins.beacon.beacon
import com.intuit.player.plugins.coroutines.subScope
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel
import kotlinx.serialization.ContextualSerializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlin.reflect.KClass

/**
 * [RenderableAsset] is the base class for each asset in an asset tree.
 * It is the second stage in the transform process. It's most important
 * method is [render], which delegates to [initView] and [hydrate]
 * to instantiate a [View] and populate it with the latest [asset] data.
 * This approach attempts to optimize by preventing unnecessary [View]
 * mutations.
 *
 * [RenderableAsset]s are powered with an [AssetContext], which provides
 * access to the underlying asset node as well as the Android [Context].
 * Beaconing and expansion hooks can be accessed through the [AssetContext]
 * as well. The asset registry is responsible for creating [RenderableAsset]s
 * and can be configured with any factory method to supply [AssetContext]s
 * to a new instance. However, it is recommended just propagate the
 * [AssetContext] in the constructor as to keep asset registration simple.
 */
@Serializable(RenderableAsset.ContextualSerializer::class)
public abstract class RenderableAsset
@Deprecated(
    "RenderableAssets should be migrated to DecodableAsset",
    ReplaceWith("DecodableAsset(assetContext, serializer)"),
    DeprecationLevel.ERROR,
)
public constructor(public val assetContext: AssetContext) : NodeWrapper {

    /**
     * Helper to get the current cached [AssetContext] and [View].
     * Will return empty pair if not found.
     */
    private val cachedAssetView get() =
        player.getCachedAssetView(assetContext) ?: cachedAssetViewNotFound

    /** Main API */
    public val asset: Asset by assetContext::asset
    public val player: AndroidPlayer by assetContext::player
    public val context: Context? by assetContext::context

    override val node: Node by asset

    /** Build arbitrary [View] to represent the [asset] */
    protected abstract fun initView(): View

    /** Hydrate [View] with data from [asset] */
    protected abstract fun View.hydrate()

    /**
     * A [CoroutineScope] that should be used when launching coroutines during asset hydration.
     * This scope will be cancelled on each re-render (i.e. whenever the data updates) and when
     * the [Player.flowScope] is cancelled.
     */
    protected val hydrationScope: CoroutineScope get() = _hydrationScope
        ?: throw PlayerException("Attempted to use hydrationScope outside hydration context! Ensure usage remains within the RenderableAsset.hydrate function...")

    private var _hydrationScope: CoroutineScope?
        get() = player.getCachedHydrationScope(assetContext)
        set(value) = player.cacheHydrationScope(assetContext, value)

    /**
     * Construct a [View] that represents the asset.
     *
     * The default implementation delegates to [initView] and [hydrate]
     * to construct this [View] and populate it with the latest data. It
     * also automatically caches the instance of the [View] and detects
     * when it needs to reconstruct or rehydrate.
     */
    private fun render(): View = cachedAssetView.let { (cachedAssetContext, cachedView) ->
        requireContext()
        when {
            // View not found. Create and hydrate.
            cachedView == null -> initView().also(::rehydrate)
            // View found, but contexts are out of sync. Remove cached view and create and hydrate.
            cachedAssetContext?.context != context || cachedAssetContext?.asset?.type != asset.type -> {
                cachedView.removeSelf()
                initView().also(::rehydrate)
            }
            // View found, but assets are out of sync. Rehydrate. It is possible for the hydrate
            // implementation to throw [StaleViewException] to signify that the view is out of sync.
            // This can only be done from invalidateView, so we have a guarantee that the view has
            // already been removed from the cache.
            !cachedAssetContext.asset.nativeReferenceEquals(asset) ->
                try {
                    cachedView.also(::rehydrate)
                } catch (exception: StaleViewException) {
                    player.logger.info("re-rendering due to stale child: ${exception.assetContext.id}")
                    render()
                }
            // View found, everything is in sync. Do nothing.
            else -> cachedView
        }
    }.also { player.cacheAssetView(assetContext, it) }

    /** Invalidate view, causing a complete re-render of the current asset */
    public fun invalidateView() {
        player.removeCachedAssetView(assetContext)
        throw StaleViewException(assetContext)
    }

    /** Instruct a [RenderableAsset] to [rehydrate] */
    public fun rehydrate(): Unit = cachedAssetView.let { (_, view) ->
        try {
            view?.also(::rehydrate)
        } catch (exception: StaleViewException) {
            player.inProgressState?.fail("stale child while trying to rehydrate: ${exception.assetContext.id}")
        }
    }

    /** Private helper for managing scope for hydration */
    private fun rehydrate(view: View) {
        _hydrationScope?.cancel("rehydrating ${asset.id}")
        _hydrationScope = player.subScope()
        view.hydrate()
    }

    /**
     * Render the asset using the resulting [Context] of the [AndroidPlayer.Hooks.ContextHook]
     * called with the provided [context].
     */
    public fun render(context: Context): View = assetContext
        .withContext(player.hooks.context.call(context))
        .build()
        .render()

    /** Render child asset from the context of a parent asset, ensuring that the [context] is passed down */
    public fun RenderableAsset.render(): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .build()
        .render()

    /** Render a [View] with specific [styles] */
    public fun RenderableAsset.render(@StyleRes vararg styles: Style?): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .withStyles(*styles)
        .build()
        .render()

    /** Render a [View] with specific [styles] */
    public fun RenderableAsset.render(@StyleRes styles: Styles): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .withStyles(styles)
        .build()
        .render()

    /** Render a [View] with a specific [tag] through a new [RenderableAsset] created with a new [AssetContext] */
    public fun RenderableAsset.render(tag: String): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .withTag(tag)
        .build()
        .render()

    /** Render a [View] with specific [styles] */
    public fun RenderableAsset.render(@StyleRes vararg styles: Style?, tag: String): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .withTag(tag)
        .withStyles(*styles)
        .build()
        .render()

    /** Render a [View] with specific [styles] */
    public fun RenderableAsset.render(@StyleRes styles: Styles, tag: String): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .withTag(tag)
        .withStyles(styles)
        .build()
        .render()

    /** Expansion helpers */

    /** Unwraps the [AssetWrapper] extracting [asset] as a [RenderableAsset] */
    public fun AssetWrapper.asRenderableAsset(): RenderableAsset? = player.expandAsset(this.asset)

    /** Expand [name] as a [RenderableAsset] from the base [asset] */
    @Deprecated(DEPRECATED_WITH_DECODABLEASSET, level = DeprecationLevel.ERROR)
    @Suppress("DEPRECATION_ERROR")
    public fun expand(name: String, context: Context? = this@RenderableAsset.context): RenderableAsset? = asset.expand(name, context)

    /** Expand [name] as a [RenderableAsset] from [this] specific [Node] */
    @Deprecated(DEPRECATED_WITH_DECODABLEASSET, level = DeprecationLevel.ERROR)
    @Suppress("DEPRECATION_ERROR")
    public fun Node.expand(name: String, context: Context? = this@RenderableAsset.context): RenderableAsset? = getObject(name)
        ?.let(::AssetWrapper)
        ?.run { expand(context) }

    /** Expand an [AssetWrapper] with a potentially styled [Context] */
    @Deprecated(DEPRECATED_WITH_DECODABLEASSET, level = DeprecationLevel.ERROR)
    public fun AssetWrapper.expand(context: Context? = this@RenderableAsset.context): RenderableAsset? = asset
        .let { player.expandAsset(it, context) }

    /** Expand [name] as a collection of [RenderableAsset]s from the base [asset] */
    @Deprecated(DEPRECATED_WITH_DECODABLEASSET, level = DeprecationLevel.ERROR)
    @Suppress("DEPRECATION_ERROR")
    public fun expandList(name: String, context: Context? = this@RenderableAsset.context): List<RenderableAsset> = asset.expandList(name, context)

    /** Expand [name] as a collection of [RenderableAsset]s from [this] specific [Node] */
    @Deprecated(DEPRECATED_WITH_DECODABLEASSET, level = DeprecationLevel.ERROR)
    @Suppress("DEPRECATION_ERROR")
    public fun Node.expandList(name: String, context: Context? = this@RenderableAsset.context): List<RenderableAsset> = getList(name)
        ?.filterIsInstance<Node>()
        ?.map(::AssetWrapper)
        ?.mapNotNull { it.expand(context) } ?: emptyList()

    public fun beacon(
        action: String,
        element: String,
        asset: Asset = this.asset,
        data: Any? = null
    ): Unit = player.beacon(action, element, asset, data)

    public fun requireContext(): Context = context ?: run {
        val error = PlayerException("Android context not found! Ensure the asset is rendered with a valid Android context.")
        player.inProgressState?.fail(error)
        throw error
    }

    /**
     * Special interface to be implemented by assets that are meant to fill
     * the entire player canvas space regardless of content length
     */
    public interface ViewportAsset

    private companion object {
        private val cachedAssetViewNotFound: Pair<AssetContext?, View?> = null to null
    }

    public class Serializer(private val player: AndroidPlayer) : KSerializer<RenderableAsset?> {

        override val descriptor: SerialDescriptor = buildClassSerialDescriptor("com.intuit.player.android.asset.RenderableAsset")

        /** Deserialize using the expansion process */
        override fun deserialize(decoder: Decoder): RenderableAsset? = decoder.requireNodeDecoder()
            .decodeNode()
            .let(::AssetWrapper)
            .asset
            .let(player::expandAsset)

        /** Serialization of [RenderableAsset]s are not supported */
        override fun serialize(encoder: Encoder, value: RenderableAsset?): Nothing =
            throw SerializationException("DecodableAsset.Serializer.serialize is not supported")

        /** Conform this [Serializer] to cast the expanded asset to [T] */
        public inline fun <reified T : RenderableAsset?> conform(): KSerializer<T> = object : KSerializer<T?> by this as KSerializer<T?> {
            override fun deserialize(decoder: Decoder) = this@Serializer.deserialize(decoder) as? T
        } as KSerializer<T>

        public fun <T : RenderableAsset> conform(klass: KClass<T>): KSerializer<T> = object : KSerializer<T?> by this as KSerializer<T?> {
            override fun deserialize(decoder: Decoder) = try {
                klass.javaObjectType.cast(this@Serializer.deserialize(decoder))
            } catch (e: ClassCastException) {
                null
            }
        } as KSerializer<T>
    }

    // Seemingly needed to prevent stack overflow: https://github.com/Kotlin/kotlinx.serialization/issues/1776
    internal object ContextualSerializer : KSerializer<RenderableAsset> by ContextualSerializer(RenderableAsset::class)
}
