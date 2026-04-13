package com.intuit.playerui.android.asset

import android.content.Context
import android.view.View
import androidx.annotation.StyleRes
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.build
import com.intuit.playerui.android.extensions.Style
import com.intuit.playerui.android.extensions.Styles
import com.intuit.playerui.android.extensions.removeSelf
import com.intuit.playerui.android.withContext
import com.intuit.playerui.android.withStyles
import com.intuit.playerui.android.withTag
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.asset.AssetWrapper
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.encoding.requireNodeDecoder
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.fail
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.plugins.beacon.beacon
import com.intuit.playerui.plugins.coroutines.subScope
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlin.reflect.KClass

internal typealias CachedAssetView = Pair<AssetContext?, View?>

/**
 * [RenderableAsset] is the base class for each asset in an asset tree.
 * Subclasses implement [initView] and [hydrate] to provide a [View] populated
 * with typed [Data] decoded from the asset node.
 *
 * [RenderableAsset]s are powered with an [AssetContext], which provides
 * access to the underlying asset node as well as the Android [Context].
 * Beaconing and expansion hooks can be accessed through the [AssetContext]
 * as well.
 */
public abstract class RenderableAsset<Data>(
    override val assetContext: AssetContext,
    private val serializer: KSerializer<Data>,
) : GenericAsset, NodeWrapper {

    internal val cachedAssetView: CachedAssetView get() =
        player.getCachedAssetView(assetContext) ?: cachedAssetViewNotFound

    /** Main API */
    public val asset: Asset by assetContext::asset
    public val player: AndroidPlayer by assetContext::player
    public val context: Context? by assetContext::context

    override val node: Node by asset

    /** Suspendable way to deserialize an instance of [Data] */
    public suspend fun getData(): Data = withContext(Dispatchers.Default) {
        @Suppress("DEPRECATION")
        data
    }

    @Deprecated(
        "Direct access to this property encourages blocking runtime access, use suspendable getData instead to ensure threads aren't blocked on data decoding.",
        ReplaceWith("getData()"),
    )
    public open val data: Data by lazy {
        try {
            asset.deserialize(serializer)
        } catch (exception: SerializationException) {
            assetContext.player.logger.error("Could not deserialize data for $asset", exception)
            throw PlayerException("Could not deserialize data for $asset", exception)
        }
    }

    // ── Abstract API ──────────────────────────────────────────────────────────

    /** Build a [View] for the asset */
    protected abstract fun initView(): View

    /** Hydrate [View] with data from [asset] */
    protected abstract fun View.hydrate()

    // ── Hydration scope ───────────────────────────────────────────────────────

    /**
     * A [CoroutineScope] for use during asset hydration.
     * Cancelled on each re-render and when the [Player.flowScope] is cancelled.
     */
    protected val hydrationScope: CoroutineScope get() = _hydrationScope
        ?: throw PlayerException(
            "Attempted to use hydrationScope outside hydration context! Ensure usage remains within the RenderableAsset.hydrate function...",
        )

    private var _hydrationScope: CoroutineScope?
        get() = player.getCachedHydrationScope(assetContext)
        set(value) = player.cacheHydrationScope(assetContext, value)

    internal fun renewHydrationScope(message: String): CoroutineScope {
        _hydrationScope?.cancel(message)
        _hydrationScope = player.subScope()
        return hydrationScope
    }

    // ── View caching / render logic ───────────────────────────────────────────

    private fun render(): View = try {
        cachedAssetView
            .let { (cachedAssetContext, cachedView) ->
                requireContext()
                when {
                    cachedView == null -> {
                        renewHydrationScope("recreating view")
                        initView().also { it.hydrate() }
                    }
                    cachedAssetContext?.context != context || cachedAssetContext?.asset?.type != asset.type -> {
                        renewHydrationScope("recreating view")
                        cachedView.removeSelf()
                        initView().also { it.hydrate() }
                    }
                    !cachedAssetContext.asset.nativeReferenceEquals(asset) ->
                        try {
                            cachedView.also(::rehydrate)
                        } catch (exception: StaleViewException) {
                            player.logger.info("re-rendering due to stale child: ${exception.assetContext.id}")
                            render()
                        }
                    else -> cachedView
                }
            }.also { if (it !is SuspendableAsset.AsyncViewStub) player.cacheAssetView(assetContext, it) }
    } catch (exception: Throwable) {
        if (exception is AssetRenderException) {
            exception.assetParentPath += assetContext
            throw exception
        } else {
            throw AssetRenderException(assetContext, "Failed to render asset", exception)
        }
    }

    public fun invalidateView() {
        player.removeCachedAssetView(assetContext)
        throw StaleViewException(assetContext)
    }

    private fun rehydrate(view: View) {
        renewHydrationScope("rehydrating ${asset.id}")
        view.hydrate()
    }

    public fun rehydrate(): Unit = cachedAssetView.let { (_, view) ->
        try {
            view?.also(::rehydrate)
        } catch (exception: StaleViewException) {
            player.inProgressState?.fail("stale child while trying to rehydrate: ${exception.assetContext.id}")
        }
    }

    // ── Public render entry points ────────────────────────────────────────────

    public fun render(context: Context): View = assetContext
        .withContext(player.hooks.context.call(context))
        .build()
        .render()

    public fun GenericAsset.render(): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .build()
        .render()

    public fun GenericAsset.render(
        @StyleRes vararg styles: Style?,
    ): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .withStyles(*styles)
        .build()
        .render()

    public fun GenericAsset.render(
        @StyleRes styles: Styles?,
    ): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .withStyles(styles)
        .build()
        .render()

    public fun GenericAsset.render(tag: String): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .withTag(tag)
        .build()
        .render()

    public fun GenericAsset.render(
        @StyleRes vararg styles: Style?,
        tag: String,
    ): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .withTag(tag)
        .withStyles(*styles)
        .build()
        .render()

    public fun GenericAsset.render(
        @StyleRes styles: Styles?,
        tag: String,
    ): View = assetContext
        .withContext(this@RenderableAsset.requireContext())
        .withTag(tag)
        .withStyles(styles)
        .build()
        .render()

    // ── Expansion helpers ─────────────────────────────────────────────────────

    public fun AssetWrapper.asRenderableAsset(): RenderableAsset<*>? = player.expandAsset(this.asset)

    // ── Utilities ─────────────────────────────────────────────────────────────

    public fun beacon(
        action: String,
        element: String,
        asset: Asset = this.asset,
        data: Any? = null,
    ): Unit = player.beacon(action, element, asset, data)

    public fun requireContext(): Context = context ?: run {
        val error = PlayerException("Android context not found! Ensure the asset is rendered with a valid Android context.")
        player.inProgressState?.fail(error)
        throw error
    }

    public interface ViewportAsset

    private companion object {
        private val cachedAssetViewNotFound: Pair<AssetContext?, View?> = null to null
    }

    // ── Serialization ─────────────────────────────────────────────────────────

    public class Serializer(
        private val player: AndroidPlayer,
    ) : KSerializer<GenericAsset?> {
        override val descriptor: SerialDescriptor = buildClassSerialDescriptor("com.intuit.playerui.android.asset.RenderableAsset")

        override fun deserialize(decoder: Decoder): GenericAsset? = decoder
            .requireNodeDecoder()
            .decodeNode()
            .let(::AssetWrapper)
            .asset
            .let(player::expandAsset)

        override fun serialize(encoder: Encoder, value: GenericAsset?): Nothing =
            throw SerializationException("RenderableAsset.Serializer.serialize is not supported")

        public inline fun <reified T : GenericAsset?> conform(): KSerializer<T> = object : KSerializer<T?> by this as KSerializer<T?> {
            override fun deserialize(decoder: Decoder) = this@Serializer.deserialize(decoder) as? T
        } as KSerializer<T>

        public fun <T : RenderableAsset<*>> conform(klass: KClass<T>): KSerializer<T> = object : KSerializer<T?> by this as KSerializer<T?> {
            override fun deserialize(decoder: Decoder) = try {
                klass.javaObjectType.cast(this@Serializer.deserialize(decoder))
            } catch (e: ClassCastException) {
                null
            }
        } as KSerializer<T>
    }
}