package com.intuit.player.android

import android.content.Context
import android.view.View
import com.intuit.hooks.*
import com.intuit.player.android.AndroidPlayer.Companion.injectDefaultPlugins
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.android.extensions.Styles
import com.intuit.player.android.extensions.overlayStyles
import com.intuit.player.android.extensions.removeSelf
import com.intuit.player.android.logger.AndroidLogger
import com.intuit.player.android.registry.RegistryPlugin
import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Completable
import com.intuit.player.jvm.core.bridge.format
import com.intuit.player.jvm.core.bridge.serialization.format.registerContextualSerializer
import com.intuit.player.jvm.core.logger.TapableLogger
import com.intuit.player.jvm.core.player.*
import com.intuit.player.jvm.core.player.state.CompletedState
import com.intuit.player.jvm.core.player.state.PlayerFlowState
import com.intuit.player.jvm.core.player.state.inProgressState
import com.intuit.player.jvm.core.plugins.LoggerPlugin
import com.intuit.player.jvm.core.plugins.Plugin
import com.intuit.player.jvm.core.plugins.findPlugin
import com.intuit.player.plugins.beacon.BeaconPlugin
import com.intuit.player.plugins.coroutines.FlowScopePlugin
import com.intuit.player.plugins.pubsub.PubSubPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.*
import kotlin.reflect.KClass

/**
 * [android.view.View] [Player] that is backed by another [Player].
 * If no backing [Player] is supplied, it will build a self-contained
 * [HeadlessPlayer] and [injectDefaultPlugins].
 */
public class AndroidPlayer private constructor(
    private val player: HeadlessPlayer,
    override val plugins: List<Plugin> = player.plugins,
) : Player() {

    /** Convenience constructor to provide vararg style [plugins] parameter */
    public constructor(
        vararg plugins: Plugin,
    ) : this(plugins.toList())

    /**
     * Constructor that takes a [context] and collection of [Plugin]s.
     * It will create a self-contained headless player with the set
     * of [Plugin]s along with the default plugins, if not already
     * included.
     */
    public constructor(
        plugins: List<Plugin>,
    ) : this(HeadlessPlayer(*plugins.injectDefaultPlugins().toTypedArray()))

    /**
     * Allow the [AndroidPlayer] to be built on top of a pre-existing
     * headless [player]. Since the headless [player] is already
     * instantiated, we can only accept [AndroidPlayerPlugin]s here.
     * Using vararg to pass [AndroidPlayerPlugin] to avoid clash w/
     * primary constructor. Otherwise, this will have to be abstracted
     * to a builder pattern.
     *
     * It is important to note that with this pattern, there are no
     * default [Plugin]s applied to the headless [player] since it
     * is already defined.
     *
     * This is internal because there is a conflict with the registry
     * being a player plugin.
     */
    internal constructor(
        player: HeadlessPlayer,
        vararg plugins: AndroidPlayerPlugin,
    ) : this(
        player,
        (plugins.toList() + player.plugins).distinct(),
    )

    override val logger: TapableLogger by player::logger

    public class Hooks internal constructor(hooks: Player.Hooks) : Player.Hooks by hooks {
        public class ContextHook : SyncWaterfallHook<(HookContext, Context) -> Context, Context>() {
            public fun call(context: Context): Context = super.call(
                context,
                { f, acc, hookCtx -> f(hookCtx, acc) },
                { f, hookCtx -> f(hookCtx, context) }
            )
        }

        internal class RecycleHook : SyncHook<(HookContext) -> Unit>() {
            public fun call(): Unit = super.call { f, context ->
                f(context)
            }
        }

        internal class ReleaseHook : SyncHook<(HookContext) -> Unit>() {
            public fun call(): Unit = super.call { f, context ->
                f(context)
            }
        }

        public class UpdateHook : SyncBailHook<(RenderableAsset?) -> BailResult<Unit>, Unit>() {
            public fun call(asset: RenderableAsset?, default: (HookContext) -> Unit): Unit? = super.call(
                { f, _ ->
                    f(asset)
                },
                default
            )
        }

        public val context: ContextHook = ContextHook()
        public val update: UpdateHook = UpdateHook()
        internal val recycle: RecycleHook = RecycleHook()
        internal val release: ReleaseHook = ReleaseHook()
    }

    override val hooks: Hooks = Hooks(player.hooks)

    override val state: PlayerFlowState by player::state

    override val scope: CoroutineScope by player::scope

    override fun start(flow: String): Completable<CompletedState> = player.start(flow)

    private val assetSerializer = RenderableAsset.Serializer(this)

    /** [Registry] of [RenderableAsset] builders */
    private val assetRegistry: RegistryPlugin<(AssetContext) -> RenderableAsset> = findPlugin()!!

    public inline fun <reified T : RenderableAsset> registerAsset(type: String, noinline factory: (AssetContext) -> T): Unit =
        registerAsset(T::class, type, factory)

    /** Helper provided to reduce overhead for simple asset registrations */
    public fun <T : RenderableAsset> registerAsset(klass: KClass<T>, type: String, factory: (AssetContext) -> T) {
        registerAsset(klass, mapOf(TYPE to type), factory)
    }

    public inline fun <reified T : RenderableAsset> registerAsset(props: Map<String, Any>, noinline factory: (AssetContext) -> T): Unit =
        registerAsset(T::class, props, factory)

    /** Helper provided to reduce overhead for asset registrations with metaData */
    public fun <T : RenderableAsset> registerAsset(klass: KClass<T>, props: Map<String, Any>, factory: (AssetContext) -> RenderableAsset) {
        assetRegistry.register(props, factory)
        if (player.format.serializersModule.getContextual(klass) == null)
            player.format.registerContextualSerializer(klass, assetSerializer.conform(klass))
    }

    /** Apply [AndroidPlayerPlugin]s last */
    init {
        player.format.registerContextualSerializer(assetSerializer.conform())

        plugins
            .filterIsInstance<AndroidPlayerPlugin>()
            .forEach { it.apply(this) }
    }

    /**
     * Register a [assetHandler] to be called on each [View] update with
     * the [RenderableAsset] from [expandAsset].
     */
    public fun onUpdate(assetHandler: (RenderableAsset?, Boolean) -> Unit) {
        val transition = SingleAccessValue(false)
        player.hooks.viewController.tap { viewController ->
            viewController?.hooks?.view?.tap { view ->
                transition.value = true
                clearCaches()
                view?.hooks?.onUpdate?.tap { asset ->
                    try {
                        expandAsset(asset).let { expandedAsset ->
                            hooks.update.call(expandedAsset) {
                                assetHandler(expandedAsset, transition.value)
                            }
                        }
                    } catch (exception: Exception) {
                        logger.error("Error while expanding ${asset?.id}", exception)
                        inProgressState?.fail(PlayerException("Error while expanding ${asset?.id}", exception))
                    }
                }
            }
        }
    }

    /**
     * Cache for [Context] overlays. This helps ensure we match against [View]s
     * that were created with styled [Context]s.
     */
    private val cachedContexts: MutableMap<Pair<Context, Styles>, Context> = mutableMapOf()

    /** Attempt to retrieve a strictly styled [Context] with a base [context] and specific [styles] */
    public fun getCachedStyledContext(context: Context, styles: Styles): Context = cachedContexts.getOrPut(context to styles) {
        context.overlayStyles(styles)
    }

    /**
     * Cache [AssetContext]-[View] pairs against the [AssetContext.id]. The [AssetContext] is
     * cached to enable checking if the [View] has been hydrated with the latest [Asset].
     */
    private val cachedAssetViews: MutableMap<String, Pair<AssetContext, View>> = mutableMapOf()

    /** Retrieve any [AssetContext]-[View] pair that is cached for this [AssetContext.id] */
    internal fun getCachedAssetView(assetContext: AssetContext): Pair<AssetContext, View>? = cachedAssetViews[assetContext.id]

    /** Cache the [AssetContext]-[View] pair associated with the [AssetContext.id] */
    internal fun cacheAssetView(assetContext: AssetContext, view: View) {
        cachedAssetViews[assetContext.id] = assetContext to view
    }

    /**
     * Remove the currently cached [AssetContext]-[View] pair associated with the
     * [AssetContext.id] and detach from parent.
     */
    internal fun removeCachedAssetView(assetContext: AssetContext) {
        cachedAssetViews.remove(assetContext.id)?.second?.removeSelf()
    }

    /** Cache current [CoroutineScope]s against [AssetContext.id] */
    // TODO: This excessive caching strategy at the AndroidPlayer level is getting out of control
    //  Remedying this should be considered with regards to the RenderableAsset lifecycle, i.e. 1..1 per AssetContext
    //  At the very least, we can scale this to a context pattern where arbitrary things can be cached at
    //  the player level instead of burdening this AndroidPlayer with this knowledge explicitly
    private val cachedHydrationScopes: MutableMap<String, CoroutineScope> = mutableMapOf()

    /** Retrieve the hydration [CoroutineScope] for the [assetContext] */
    internal fun getCachedHydrationScope(assetContext: AssetContext): CoroutineScope? = cachedHydrationScopes[assetContext.id]

    /** Cache the hydration [CoroutineScope] against the [assetContext] */
    internal fun cacheHydrationScope(assetContext: AssetContext, coroutineScope: CoroutineScope?) {
        coroutineScope?.let {
            cachedHydrationScopes[assetContext.id] = coroutineScope
        } ?: cachedHydrationScopes.remove(assetContext.id)
    }

    private fun clearCaches() {
        cachedAssetViews.clear()
        cachedContexts.clear()
    }

    /**
     * Clear any cached data. This should be used when the player has
     * been pushed to the background. The flow will still be "active",
     * but any Android lifecycle-aware references will be cleared to
     * prevent a leak.
     */
    public fun recycle() {
        // TODO: Remove this check by enhancing TapableLogger to out-last Player lifecycle to use default
        if (!player.runtime.isReleased()) logger.debug("AndroidPlayer: recycling player")
        clearCaches()
        hooks.recycle.call()
    }

    override fun release() {
        // TODO: Remove this check by enhancing TapableLogger to out-last Player lifecycle to use default
        if (!player.runtime.isReleased()) player.logger.debug("AndroidPlayer: releasing player")
        clearCaches()
        player.release()
        hooks.release.call()
    }

    /**
     * Method used for transforming [Asset]s into [RenderableAsset]s. The [context]
     * parameter is configurable to allow for styles to cascade down through the
     * [Asset] tree.
     */
    // TODO: Do we even need context as a param anymore?
    internal fun expandAsset(asset: Asset?, context: Context? = null): RenderableAsset? = asset?.let { (id, type) ->
        val factory = assetRegistry[id] ?: run {
            logger.warn("Warning in flow: $id of type $type is not registered")
            return@let null
        }

        AssetContext(context, asset, this, factory).build()
    }

    /** Wrapper class for values that are only supposed to be consumed once before
     * resetting to default */
    internal class SingleAccessValue<T>(private val default: T) {
        var value: T = default
            get() = try { field } finally { field = default }
    }

    private companion object {
        private val defaultLogger = AndroidLogger("AndroidPlayer")

        private fun buildDefaultPlugins() = listOf(
            PubSubPlugin::class.java to PubSubPlugin(),
            BeaconPlugin::class.java to BeaconPlugin(),
            RegistryPlugin::class.java to RegistryPlugin<(AssetContext) -> RenderableAsset>(),
            FlowScopePlugin::class.java to FlowScopePlugin(),
            LoggerPlugin::class.java to defaultLogger,
        )

        /** Helper to add default plugins if there isn't already an instance of that plugin */
        private fun List<Plugin>.injectDefaultPlugins() = buildDefaultPlugins()
            .fold(this) { plugins, (defaultPluginClass, defaultPlugin) ->
                if (plugins.filterIsInstance(defaultPluginClass).isEmpty()) plugins + defaultPlugin
                else plugins
            }
    }
}
