package com.intuit.playerui.android.asset

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.view.View
import android.view.ViewGroup
import androidx.annotation.StyleRes
import androidx.core.view.children
import com.intuit.hooks.HookContext
import com.intuit.hooks.SyncHook
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayerPlugin
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.R
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
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.fail
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.plugins.findPlugin
import com.intuit.playerui.core.utils.InternalPlayerApi
import com.intuit.playerui.plugins.beacon.beacon
import com.intuit.playerui.plugins.coroutines.subScope
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.cancel
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlin.coroutines.cancellation.CancellationException
import kotlin.coroutines.coroutineContext
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

    /** Build a [View] for the asset, to be launched in [Dispatchers.Default] */
    public abstract suspend fun initView(data: Data): View

    /** Hydrate [View] with data from [asset], to be launched in [Dispatchers.Main] */
    public abstract suspend fun View.hydrate(data: Data)

    // ── Concrete initView / hydrate implementations ───────────────────────────

    private fun initView(): View {
        // ensure we pre-track hydration to ensure all assets are accounted for during async hydration
        player.asyncHydrationTrackerPlugin?.trackHydration(this@RenderableAsset)
        return AsyncViewStub(
            hydrationScope,
            hydrationScope.async { doInitView() },
            requireContext(),
        ) {
            doHydrate()
            player.cacheAssetView(assetContext, this)
        }
    }

    private suspend fun doInitView() = withContext(Dispatchers.Default) {
        initView(getData()).apply { setTag(R.bool.view_hydrated, false) }
    }

    private fun View.hydrate() {
        if (this is AsyncViewStub) return

        player.asyncHydrationTrackerPlugin?.trackHydration(this@RenderableAsset)
        setTag(R.bool.view_hydrated, false)
        hydrationScope.launch(Dispatchers.Main) { doHydrate() }
    }

    private suspend fun View.doHydrate() = withContext(Dispatchers.Main) {
        try {
            hydrate(getData())
            setTag(R.bool.view_hydrated, true)
        } catch (exception: StaleViewException) {
            // b/c we're launched in a scope that isn't cared about anymore, we can't appropriately handle this, so just fast fail
            player.inProgressState?.fail(
                PlayerException(
                    "SuspendableAssets can't appropriately handle invalidateViews currently, this should be handled in a future major",
                    exception,
                ),
            )
        } catch (exception: Throwable) {
            // ignore cancellation exceptions because those are used to rehydrate the view
            if (exception is CancellationException) {
                throw exception
            }

            if (exception is AssetRenderException) {
                exception.assetParentPath += assetContext
                throw exception
            } else {
                throw AssetRenderException(assetContext, "Failed to render asset", exception)
            }
        } finally {
            player.asyncHydrationTrackerPlugin?.hydrationDone(this@RenderableAsset)
        }
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
            }.also { if (it !is AsyncViewStub) player.cacheAssetView(assetContext, it) }
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

    // ── Async hydration tracking ──────────────────────────────────────────────

    @ExperimentalPlayerApi
    public class AsyncHydrationTrackerPlugin : AndroidPlayerPlugin {
        private var trackedHydrations = mutableSetOf<String>()

        public val hooks: Hooks = Hooks()

        public fun trackHydration(asset: RenderableAsset<*>) {
            synchronized(trackedHydrations) {
                if (trackedHydrations.isEmpty()) hooks.onHydrationStarted.call()
                trackedHydrations.add(asset.assetContext.id)
            }
        }

        public fun hydrationDone(asset: RenderableAsset<*>) {
            val doneHydrating = synchronized(trackedHydrations) {
                trackedHydrations.remove(asset.assetContext.id)
                trackedHydrations.isEmpty()
            }

            if (doneHydrating) {
                hooks.onHydrationComplete.call()
            }
        }

        override fun apply(androidPlayer: AndroidPlayer) {
            androidPlayer.hooks.viewController.tap { viewController ->
                viewController?.hooks?.view?.tap { view ->
                    view?.hooks?.onUpdate?.tap { _ ->
                        synchronized(trackedHydrations) {
                            trackedHydrations.clear()
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

    /** ViewStub derivative that will replace itself in the view tree once the [view] has resolved */
    @Suppress("ktlint:standard:annotation") // To prevent class from being double indented
    @SuppressLint("ViewConstructor") // TODO: Do we need this one?
    @InternalPlayerApi
    public class AsyncViewStub @JvmOverloads constructor(
        private val scope: CoroutineScope,
        private val view: Deferred<View>,
        context: Context,
        attrs: AttributeSet? = null,
        defStyle: Int = 0,
        private val onView: suspend View.() -> Unit = {},
    ) : View(context, attrs, defStyle),
        View.OnAttachStateChangeListener {
        private val hydratedView: Deferred<View> = scope.async {
            view.await().also { onView(it) }
        }

        init {
            addOnAttachStateChangeListener(this)
        }

        /** Suspend until there is a hydrated view, or returns null if the provided [scope] is cancelled */
        public suspend fun awaitView(): View? = try {
            suspend fun ViewGroup.awaitAsyncChildren() {
                children.forEach {
                    when (it) {
                        is AsyncViewStub -> it.awaitView()
                        is ViewGroup -> it.awaitAsyncChildren()
                    }
                }
            }
            hydratedView.await().also { parent ->
                (parent as? ViewGroup)?.awaitAsyncChildren()
                replaceSelfWithView(parent)
            }
        } catch (e: CancellationException) {
            // if it was the calling scope that is cancelled, this will re-raise
            coroutineContext.ensureActive()
            null
        }

        /** Callback handler for when there is a hydrated view */
        public fun onView(handler: (View) -> Unit) {
            scope.launch {
                awaitView()?.let(handler)
            }
        }

        override fun onViewAttachedToWindow(v: View) {
            scope.launch(Dispatchers.Main) {
                awaitView()
            }
        }

        override fun onViewDetachedFromWindow(v: View) {}

        override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
            setMeasuredDimension(0, 0)
        }

        @SuppressLint("MissingSuperCall")
        override fun onAttachedToWindow() {}

        @SuppressLint("MissingSuperCall")
        override fun draw(canvas: Canvas) {}

        override fun dispatchDraw(canvas: Canvas) {}

        private fun replaceSelfWithView(view: View) {
            val parent = parent as? ViewGroup ?: return
            val index = parent.indexOfChild(this)
            parent.removeViewInLayout(this)
            val layoutParams = layoutParams
            if (layoutParams != null) {
                parent.addView(view, index, layoutParams)
            } else {
                parent.addView(view, index)
            }
            removeOnAttachStateChangeListener(this)
        }
    }
}

public val AndroidPlayer.asyncHydrationTrackerPlugin: RenderableAsset.AsyncHydrationTrackerPlugin? get() = findPlugin()
