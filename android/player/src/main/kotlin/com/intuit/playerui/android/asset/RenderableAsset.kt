package com.intuit.playerui.android.asset

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.StyleRes
import com.intuit.hooks.HookContext
import com.intuit.hooks.SyncHook
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayerPlugin
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.build
import com.intuit.playerui.android.extensions.Style
import com.intuit.playerui.android.extensions.Styles
import com.intuit.playerui.android.extensions.into
import com.intuit.playerui.android.extensions.removeSelf
import com.intuit.playerui.android.withContext
import com.intuit.playerui.android.withStyles
import com.intuit.playerui.android.withTag
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.asset.AssetWrapper
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.encoding.requireNodeDecoder
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.fail
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.plugins.findPlugin
import com.intuit.playerui.plugins.beacon.beacon
import com.intuit.playerui.plugins.coroutines.subScope
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlin.coroutines.cancellation.CancellationException
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
) : GenericAsset,
    NodeWrapper {
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

    /** Build a [View] for the asset, to be launched in [Dispatchers.Default] */
    public abstract suspend fun initView(data: Data): View

    /** Hydrate [View] with data from [asset]. Runs on [Dispatchers.Main]; [this] scope is the [hydrationScope] for launching child renders. */
    public abstract suspend fun CoroutineScope.hydrate(view: View, data: Data)

    // ── Concrete render implementation ────────────────────────────────────────

    private suspend fun doRender(isRoot: Boolean = false): View {
        player.asyncHydrationTrackerPlugin?.trackHydration(this, isRoot)
        return try {
            val (data, view) = withContext(Dispatchers.Default) {
                val data = getData()
                data to initView(data)
            }
            withContext(Dispatchers.Main) {
                hydrationScope.hydrate(view, data)
            }
            view
        } catch (exception: Throwable) {
            if (exception is CancellationException) throw exception
            if (exception is StaleViewException) throw exception
            if (exception is AssetRenderException) {
                exception.assetParentPath += assetContext
                throw exception
            }
            throw AssetRenderException(assetContext, "Failed to render asset", exception)
        } finally {
            player.asyncHydrationTrackerPlugin?.renderingComplete(this)
        }
    }

    internal suspend fun render(isRoot: Boolean = false): View = try {
        cachedAssetView
            .let { (cachedAssetContext, cachedView) ->
                requireContext()
                when {
                    cachedView == null -> {
                        renewHydrationScope("recreating view")
                        doRender(isRoot)
                    }
                    cachedAssetContext?.context != context || cachedAssetContext?.asset?.type != asset.type -> {
                        renewHydrationScope("recreating view")
                        cachedView.removeSelf()
                        doRender(isRoot)
                    }
                    !cachedAssetContext.asset.nativeReferenceEquals(asset) -> {
                        // TODO: ideally rehydrate the existing view rather than recreating it
                        renewHydrationScope("rehydrating ${asset.id}")
                        doRender(isRoot)
                    }
                    else -> cachedView.also {
                        player.asyncHydrationTrackerPlugin?.let { tracker ->
                            if (isRoot) tracker.trackHydration(this@RenderableAsset, isRoot = true)
                            tracker.renderingComplete(this@RenderableAsset)
                        }
                    }
                }
            }.also { player.cacheAssetView(assetContext, it) }
    } catch (exception: Throwable) {
        if (exception is AssetRenderException) {
            exception.assetParentPath += assetContext
            throw exception
        }
        throw AssetRenderException(assetContext, "Failed to render asset", exception)
    }

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

    // ── Rehydration ───────────────────────────────────────────────────────────

    private fun rehydrate(view: View) {
        renewHydrationScope("rehydrating ${asset.id}")
        player.asyncHydrationTrackerPlugin?.trackHydration(this, isRoot = true)
        hydrationScope.launch {
            try {
                val data = getData()
                withContext(Dispatchers.Main) {
                    hydrationScope.hydrate(view, data)
                }
            } catch (exception: StaleViewException) {
                player.inProgressState?.fail(
                    PlayerException("Stale view during rehydration", exception),
                )
            } catch (exception: CancellationException) {
                throw exception
            } catch (exception: AssetRenderException) {
                exception.assetParentPath += assetContext
                throw exception
            } catch (exception: Throwable) {
                throw AssetRenderException(assetContext, "Failed to rehydrate asset", exception)
            } finally {
                player.asyncHydrationTrackerPlugin?.renderingComplete(this@RenderableAsset)
            }
        }
    }

    public fun invalidateView() {
        player.removeCachedAssetView(assetContext)
        throw StaleViewException(assetContext)
    }

    public fun rehydrate(): Unit = cachedAssetView.let { (_, view) ->
        try {
            view?.also(::rehydrate)
        } catch (exception: StaleViewException) {
            player.inProgressState?.fail("stale child while trying to rehydrate: ${exception.assetContext.id}")
        }
    }

    // ── Public render entry points ────────────────────────────────────────────

    private fun CoroutineScope.inflateChild(child: RenderableAsset<*>, container: ViewGroup) {
        player.asyncHydrationTrackerPlugin?.preTrackChild(child)
        launch {
            try {
                val view = child.render()
                withContext(Dispatchers.Main) { view into container }
            } catch (_: CancellationException) {
            }
        }
    }

    public fun CoroutineScope.inflate(child: GenericAsset?, container: ViewGroup) {
        val asset = child?.assetContext?.run { withContext(requireContext()).build() } ?: return
        inflateChild(asset, container)
    }

    public fun CoroutineScope.inflate(
        child: GenericAsset?,
        container: ViewGroup,
        @StyleRes vararg styles: Style?,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withStyles(*styles).build() } ?: return
        inflateChild(asset, container)
    }

    public fun CoroutineScope.inflate(
        child: GenericAsset?,
        container: ViewGroup,
        @StyleRes styles: Styles?,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withStyles(styles).build() } ?: return
        inflateChild(asset, container)
    }

    public fun CoroutineScope.inflate(
        child: GenericAsset?,
        container: ViewGroup,
        tag: String,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withTag(tag).build() } ?: return
        inflateChild(asset, container)
    }

    public fun CoroutineScope.inflate(
        child: GenericAsset?,
        container: ViewGroup,
        @StyleRes vararg styles: Style?,
        tag: String,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withTag(tag).withStyles(*styles).build() } ?: return
        inflateChild(asset, container)
    }

    public fun CoroutineScope.inflate(
        child: GenericAsset?,
        container: ViewGroup,
        @StyleRes styles: Styles?,
        tag: String,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withTag(tag).withStyles(styles).build() } ?: return
        inflateChild(asset, container)
    }

    /** Root entry point — render this asset into [container] using [context] to bootstrap the context chain. */
    public fun CoroutineScope.renderInto(container: FrameLayout, context: Context) {
        val asset = assetContext
            .withContext(player.hooks.context.call(context))
            .build()
        launch {
            try {
                val view = asset.render(isRoot = true)
                withContext(Dispatchers.Main) { view into container }
            } catch (_: CancellationException) {
            }
        }
    }

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

        public fun <T : RenderableAsset<*>> conform(klass: KClass<T>): KSerializer<T> =
            object : KSerializer<T?> by this as KSerializer<T?> {
                override fun deserialize(decoder: Decoder) = try {
                    klass.javaObjectType.cast(this@Serializer.deserialize(decoder))
                } catch (e: ClassCastException) {
                    null
                }
            } as KSerializer<T>
    }

    // ── Async hydration tracking ──────────────────────────────────────────────

    @ExperimentalPlayerApi
    public class AsyncHydrationTrackerPlugin : AndroidPlayerPlugin {
        private var counter = 0

        public val hooks: Hooks = Hooks()

        /**
         * Called by [renderChildInto] synchronously before launching the child coroutine,
         * while still inside the parent's hydrate(). Increments the counter so it can't
         * drop to zero before the child's own [trackHydration] fires.
         */
        public fun preTrackChild(child: RenderableAsset<*>) {
            synchronized(this) {
                counter++
            }
        }

        /**
         * Called at the start of [doRender]. For root assets (no parent), increments and
         * fires [Hooks.onHydrationStarted]. For children, decrements the pre-track increment
         * and re-increments — net zero change, but fires started if this is truly the first asset.
         */
        public fun trackHydration(asset: RenderableAsset<*>, isRoot: Boolean) {
            val fireStarted: Boolean
            synchronized(this) {
                fireStarted = counter == 0
                if (isRoot) {
                    // nested assets are pre-tracked; no change needed here
                    counter++
                }
            }
            if (fireStarted) hooks.onHydrationStarted.call()
        }

        /** Called in [doRender]'s finally block. Decrements counter; fires [Hooks.onHydrationComplete] when it reaches zero. */
        public fun renderingComplete(asset: RenderableAsset<*>) {
            val fireComplete: Boolean
            synchronized(this) {
                fireComplete = --counter == 0
            }
            if (fireComplete) hooks.onHydrationComplete.call()
        }

        override fun apply(androidPlayer: AndroidPlayer) {
            androidPlayer.hooks.viewController.tap { viewController ->
                viewController?.hooks?.view?.tap { view ->
                    view?.hooks?.onUpdate?.tap { _ ->
                        synchronized(this@AsyncHydrationTrackerPlugin) {
                            counter = 0
                        }
                    }
                }
            }
        }

        public class Hooks {
            public class OnHydrationStartedHook : SyncHook<(HookContext) -> Unit>() {
                public fun call(): Unit = super.call { f, context ->
                    f(context)
                }
            }

            public class OnHydrationCompleteHook : SyncHook<(HookContext) -> Unit>() {
                public fun call(): Unit = super.call { f, context ->
                    f(context)
                }
            }

            public val onHydrationStarted: OnHydrationStartedHook = OnHydrationStartedHook()
            public val onHydrationComplete: OnHydrationCompleteHook = OnHydrationCompleteHook()
        }
    }
}

public val AndroidPlayer.asyncHydrationTrackerPlugin: RenderableAsset.AsyncHydrationTrackerPlugin? get() = findPlugin()
