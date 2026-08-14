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
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.cancel
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Contextual
import kotlinx.serialization.ContextualSerializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlin.coroutines.AbstractCoroutineContextElement
import kotlin.coroutines.CoroutineContext
import kotlin.coroutines.cancellation.CancellationException
import kotlin.reflect.KClass

internal typealias CachedAssetView = Pair<AssetContext?, View?>

/** Convenience type represents slot for any arbitrary asset instance */
public typealias AnyAsset = RenderableAsset<out @Contextual Any>

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
@Serializable(ContextualSerializer::class)
public abstract class RenderableAsset<Data>(
    public val assetContext: AssetContext,
    private val serializer: KSerializer<Data>,
) : NodeWrapper {
    internal val cachedAssetView: CachedAssetView get() =
        player.getCachedAssetView(assetContext) ?: cachedAssetViewNotFound

    /** Main API */
    public val asset: Asset by assetContext::asset
    public val player: AndroidPlayer by assetContext::player
    public val context: Context? by assetContext::context

    override val node: Node by asset

    /** Suspendable way to deserialize an instance of [Data] */
    public suspend fun getData(): Data = withContext(Dispatchers.Default) {
        data
    }

    private val data: Data by lazy {
        try {
            asset.deserialize(serializer)
        } catch (exception: SerializationException) {
            assetContext.player.logger.error("Could not deserialize data for $asset", exception)
            throw PlayerException("Could not deserialize data for $asset", exception)
        }
    }

    // ── Foundational abstract API for XML/Compose assets ──────────────────────────────────────────────────────────

    /** Build a [View] for the asset, to be launched in [Dispatchers.Default] */
    public abstract suspend fun initView(data: Data): View

    /** Hydrate [View] with data from [asset]. Runs on [Dispatchers.Main]; [this] scope is the [hydrationScope] for launching child renders. */
    public abstract fun CoroutineScope.hydrate(view: View, data: Data)

    internal class SubtreeCompletion : AbstractCoroutineContextElement(Key) {
        companion object Key : CoroutineContext.Key<SubtreeCompletion>

        private val lock = Any()
        private var pending = 0
        private var selfDone = false
        private var fired = false
        private val done = CompletableDeferred<Unit>()

        suspend fun await(): Unit = done.await()

        fun expectChild() = synchronized(lock) { pending++ }

        fun childDone() {
            if (completes { pending-- }) done.complete(Unit)
        }

        fun selfHydrateDone() {
            if (completes { selfDone = true }) done.complete(Unit)
        }

        private inline fun completes(mutate: () -> Unit): Boolean = synchronized(lock) {
            mutate()
            if (!fired && selfDone && pending == 0) {
                fired = true
                true
            } else {
                false
            }
        }
    }

    private val subtreeCompletion: SubtreeCompletion? get() =
        _hydrationScope?.coroutineContext?.get(SubtreeCompletion)

    // ── Concrete render implementation ────────────────────────────────────────

    internal suspend fun render(): View = try {
        val isRoot = currentCoroutineContext()[SubtreeCompletion] == null
        val tracker = if (isRoot) player.asyncHydrationTrackerPlugin else null
        tracker?.hooks?.onHydrationStarted?.call()
        cachedAssetView
            .let { (cachedAssetContext, cachedView) ->
                requireContext()
                when {
                    cachedView == null -> {
                        renewHydrationScope("recreating view")
                        doRender()
                    }
                    cachedAssetContext?.context != context || cachedAssetContext?.asset?.type != asset.type -> {
                        renewHydrationScope("recreating view")
                        cachedView.removeSelf()
                        doRender()
                    }
                    !cachedAssetContext.asset.nativeReferenceEquals(asset) -> {
                        renewHydrationScope("rehydrating ${asset.id}")
                        val completion = subtreeCompletion
                        try {
                            rehydrate(cachedView)
                            completion?.selfHydrateDone()
                            completion?.await()
                            cachedView
                        } catch (_: StaleViewException) {
                            renewHydrationScope("recreating after stale rehydrate")
                            doRender()
                        }
                    }
                    else -> cachedView
                }
            }.also {
                player.cacheAssetView(assetContext, it)
                tracker?.hooks?.onHydrationComplete?.call()
            }
    } catch (exception: Throwable) {
        if (exception is CancellationException) throw exception
        if (exception is AssetRenderException) {
            exception.assetParentPath += assetContext
            throw exception
        }
        throw AssetRenderException(assetContext, "Failed to render asset", exception)
    }

    private suspend fun doRender(): View {
        val completion = subtreeCompletion
        return try {
            val (data, view) = withContext(Dispatchers.Default) {
                val data = getData()
                data to initView(data)
            }
            withContext(Dispatchers.Main) {
                hydrationScope.hydrate(view, data)
            }
            completion?.selfHydrateDone()
            completion?.await()
            view
        } catch (exception: Throwable) {
            if (exception is CancellationException) throw exception
            if (exception is StaleViewException) throw exception
            if (exception is AssetRenderException) {
                exception.assetParentPath += assetContext
                throw exception
            }
            throw AssetRenderException(assetContext, "Failed to render asset", exception)
        }
    }

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
        _hydrationScope = player.subScope(SubtreeCompletion())
        return hydrationScope
    }

    // ── Rehydration ───────────────────────────────────────────────────────────

    public fun invalidateView() {
        player.removeCachedAssetView(assetContext)
        throw StaleViewException(assetContext)
    }

    public fun rehydrate(): Unit = cachedAssetView.let { (_, view) ->
        view ?: return
        renewHydrationScope("rehydrating ${asset.id}")
        val completion = subtreeCompletion
        val tracker = player.asyncHydrationTrackerPlugin
        tracker?.hooks?.onHydrationStarted?.call()
        hydrationScope.launch {
            try {
                rehydrate(view)
                completion?.selfHydrateDone()
                completion?.await()
            } catch (exception: StaleViewException) {
                player.inProgressState?.fail("stale child while trying to rehydrate: ${exception.assetContext.id}")
            } finally {
                tracker?.hooks?.onHydrationComplete?.call()
            }
        }
    }

    private suspend fun rehydrate(view: View) {
        val data = getData()
        withContext(Dispatchers.Main) {
            hydrationScope.hydrate(view, data)
        }
    }

    // ── Public render entry points ────────────────────────────────────────────

    public fun CoroutineScope.inflate(
        child: RenderableAsset<*>?,
        container: ViewGroup,
        viewApply: ((View) -> Unit)? = null,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).build() }
        inflateChild(asset, container, viewApply)
    }

    public fun CoroutineScope.inflate(
        child: RenderableAsset<*>?,
        container: ViewGroup,
        @StyleRes vararg styles: Style?,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withStyles(*styles).build() }
        inflateChild(asset, container)
    }

    public fun CoroutineScope.inflate(
        child: RenderableAsset<*>?,
        container: ViewGroup,
        @StyleRes vararg styles: Style?,
        viewApply: (View) -> Unit,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withStyles(*styles).build() }
        inflateChild(asset, container, viewApply)
    }

    public fun CoroutineScope.inflate(
        child: RenderableAsset<*>?,
        container: ViewGroup,
        @StyleRes styles: Styles?,
        viewApply: ((View) -> Unit)? = null,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withStyles(styles).build() }
        inflateChild(asset, container, viewApply)
    }

    public fun CoroutineScope.inflate(
        child: RenderableAsset<*>?,
        container: ViewGroup,
        tag: String,
        viewApply: ((View) -> Unit)? = null,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withTag(tag).build() }
        inflateChild(asset, container, viewApply)
    }

    public fun CoroutineScope.inflate(
        child: RenderableAsset<*>?,
        container: ViewGroup,
        @StyleRes vararg styles: Style?,
        tag: String,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withTag(tag).withStyles(*styles).build() }
        inflateChild(asset, container)
    }

    public fun CoroutineScope.inflate(
        child: RenderableAsset<*>?,
        container: ViewGroup,
        @StyleRes vararg styles: Style?,
        tag: String,
        viewApply: (View) -> Unit,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withTag(tag).withStyles(*styles).build() }
        inflateChild(asset, container, viewApply)
    }

    public fun CoroutineScope.inflate(
        child: RenderableAsset<*>?,
        container: ViewGroup,
        @StyleRes styles: Styles?,
        tag: String,
        viewApply: ((View) -> Unit)? = null,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withTag(tag).withStyles(styles).build() }
        inflateChild(asset, container, viewApply)
    }

    @Deprecated("Use inflate without callback instead, this may get removed without additional warning.", level = DeprecationLevel.WARNING)
    public fun CoroutineScope.inflate(
        child: RenderableAsset<*>?,
        container: ViewGroup,
        callback: ((View?) -> Unit),
        @StyleRes vararg styles: Style?,
        tag: String,
        viewApply: ((View) -> Unit)? = null,
    ) {
        val asset = child?.assetContext?.run { withContext(requireContext()).withTag(tag).withStyles(*styles).build() }
        inflateChild(asset, container, viewApply, callback)
    }

    public fun CoroutineScope.inflate(
        children: List<RenderableAsset<*>?>,
        container: ViewGroup,
        @StyleRes vararg styles: Style?,
        viewApply: ((View, Int) -> Unit)? = null,
        order: suspend List<RenderableAsset<*>?>.() -> List<RenderableAsset<*>?> = { this },
    ) {
        val completion = coroutineContext[SubtreeCompletion]
        val built = children.map { child ->
            child?.assetContext?.run { withContext(requireContext()).withStyles(*styles).build() }
        }
        built.forEach { asset -> asset?.let { completion?.expectChild() } }
        launch {
            val ordered = built.order()
            val views = ordered
                .map { asset -> asset?.let { async { it.render() } } }
                .mapIndexed { index, deferredView ->
                    deferredView?.await()?.also { view -> viewApply?.invoke(view, index) }
                }
            withContext(Dispatchers.Main) { views into container }
            built.forEach { asset -> asset?.let { completion?.childDone() } }
        }
    }

    @Deprecated("Use inflate without callback instead, this may get removed without additional warning.", level = DeprecationLevel.WARNING)
    public fun CoroutineScope.inflateViewCallback(
        children: List<RenderableAsset<*>?>,
        @StyleRes vararg styles: Style?,
        callback: ((List<View?>) -> Unit),
        viewApply: ((View, Int) -> Unit)? = null,
        order: suspend List<RenderableAsset<*>?>.() -> List<RenderableAsset<*>?> = { this },
    ) {
        val completion = coroutineContext[SubtreeCompletion]
        val built = children.map { child ->
            child?.assetContext?.run { withContext(requireContext()).withStyles(*styles).build() }
        }
        built.forEach { asset -> asset?.let { completion?.expectChild() } }
        launch {
            val ordered = built.order()
            val views = ordered
                .map { asset -> asset?.let { async { it.render() } } }
                .mapIndexed { index, deferredView ->
                    deferredView?.await()?.also { view -> viewApply?.invoke(view, index) }
                }
            withContext(Dispatchers.Main) { callback.invoke(views) }
            built.forEach { asset -> asset?.let { completion?.childDone() } }
        }
    }

    private fun CoroutineScope.inflateChild(
        child: RenderableAsset<*>?,
        container: ViewGroup,
        viewApply: ((View) -> Unit)? = null,
        callback: ((View?) -> Unit)? = null,
    ) {
        val completion = if (child != null) coroutineContext[SubtreeCompletion] else null
        completion?.expectChild()
        launch {
            val view = child?.render()
            view?.let { viewApply?.invoke(it) }
            withContext(Dispatchers.Main) {
                callback?.invoke(view) ?: (view into container)
            }
            completion?.childDone()
        }
    }

    /** Root entry point — render this asset into [container] using [context] to bootstrap the context chain. */
    public fun CoroutineScope.renderInto(container: FrameLayout, context: Context) {
        val asset = assetContext
            .withContext(player.hooks.context.call(context))
            .build()
        launch {
            try {
                val view = asset.render()
                withContext(Dispatchers.Main) { view into container }
            } catch (_: CancellationException) {
            } catch (exception: AssetRenderException) {
                player.inProgressState?.fail(exception)
            } catch (exception: Throwable) {
                player.inProgressState?.fail(AssetRenderException(assetContext, "Failed to render asset", exception))
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
    ) : KSerializer<RenderableAsset<*>?> {
        override val descriptor: SerialDescriptor = buildClassSerialDescriptor("com.intuit.playerui.android.asset.RenderableAsset")

        override fun deserialize(decoder: Decoder): RenderableAsset<*>? = decoder
            .requireNodeDecoder()
            .decodeNode()
            .let(::AssetWrapper)
            .asset
            .let(player::expandAsset)

        override fun serialize(encoder: Encoder, value: RenderableAsset<*>?): Nothing =
            throw SerializationException("RenderableAsset.Serializer.serialize is not supported")

        public inline fun <reified T : RenderableAsset<*>?> conform(): KSerializer<T> =
            object : KSerializer<T?> by this as KSerializer<T?> {
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

    // TODO: is this still needed
    @ExperimentalPlayerApi
    public class AsyncHydrationTrackerPlugin : AndroidPlayerPlugin {
        public val hooks: Hooks = Hooks()

        override fun apply(androidPlayer: AndroidPlayer) {}

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
