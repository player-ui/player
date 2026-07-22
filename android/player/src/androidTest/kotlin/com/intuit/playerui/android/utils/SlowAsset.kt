package com.intuit.playerui.android.utils

import android.util.Log
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.AnyAsset
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.runtimeFactory
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.utils.makeFlow
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json

/**
 * An asset whose initView() suspends forever (until externally cancelled or released), to
 * simulate a child still mid-render (inside render()'s own suspend call chain, on
 * Dispatchers.Default) when the parent that launched it is cancelled/re-rendered.
 */
internal class SlowAsset(
    assetContext: AssetContext,
) : RenderableAsset<SlowAsset.Data>(assetContext, Data.SlowSerializer) {
    @Serializable
    data class Data(val revision: Int = 0) {
        /**
         * Wraps the plain generated serializer, but blocks (on whatever thread calls
         * deserialize() — Dispatchers.Default via RenderableAsset.getData()'s
         * withContext(Dispatchers.Default) { data }, never Dispatchers.Main) when
         * [slowInGetData] is set. Used to stall a *fresh* SlowAsset instance's first `data`
         * access (the `data` property is `by lazy` per-instance in RenderableAsset, so a new
         * instance's deserialization genuinely suspends here) — i.e. to hold render()'s rehydrate
         * branch open inside `getData()`, before it ever reaches `withContext(Dispatchers.Main)`,
         * without blocking Robolectric's single dedicated Main thread the way blocking inside
         * hydrate() would.
         */
        object SlowSerializer : KSerializer<Data> {
            private val delegate = serializer()
            override val descriptor: SerialDescriptor get() = delegate.descriptor
            override fun serialize(encoder: Encoder, value: Data) = delegate.serialize(encoder, value)
            override fun deserialize(decoder: Decoder): Data {
                if (slowInGetData) {
                    hydrateStarted?.complete(Unit)
                    neverCompletesLatch.await()
                }
                return delegate.deserialize(decoder)
            }
        }
    }

    val currentHydrationScope get() = hydrationScope

    override suspend fun initView(data: Data): View {
        Log.e("SLOW_ASSET_DEBUG", "initView() ENTER revision=${data.revision}")
        if (slowInInitView) {
            hydrateStarted?.complete(Unit)
            try {
                neverCompletes.await()
                Log.e("SLOW_ASSET_DEBUG", "initView() await completed normally revision=${data.revision}")
            } catch (e: Throwable) {
                Log.e("SLOW_ASSET_DEBUG", "initView() await threw revision=${data.revision} exception=$e")
                throw e
            }
        }
        Log.e("SLOW_ASSET_DEBUG", "initView() EXIT revision=${data.revision}")
        return FrameLayout(requireContext())
    }

    override fun CoroutineScope.hydrate(view: View, data: Data) {
        Log.e("SLOW_ASSET_DEBUG", "hydrate() ENTER/EXIT revision=${data.revision} scope=$this")
    }

    companion object {
        /** Gates whether initView() suspends on neverCompletes. */
        var slowInInitView = true

        /** Gates whether Data's deserialization blocks on neverCompletesLatch (see SlowSerializer). */
        var slowInGetData = false

        /** Completed by deserialize()/initView() so the test knows the coroutine has actually launched. */
        var hydrateStarted: CompletableDeferred<Unit>? = null

        /** Never completed — keeps the launched coroutine suspended until its scope is cancelled. */
        var neverCompletes = CompletableDeferred<Unit>()

        /** Plain blocking latch used by Data.SlowSerializer's non-suspend stall (see above). */
        var neverCompletesLatch = java.util.concurrent.CountDownLatch(1)

        val sampleMap = mapOf(
            "id" to "slow-asset",
            "type" to "slow",
            "revision" to 0,
        )

        fun Runtime<*>.asset(revision: Int = 0): Asset =
            serialize(sampleMap + mapOf("revision" to revision)) as Asset

        val runtime = runtimeFactory.create()
        val sampleAsset = runtime.serialize(sampleMap) as Asset
        val sampleJson = Json.encodeToJsonElement(GenericSerializer(), sampleMap)
        val sampleFlow = makeFlow(sampleJson)
    }
}

/**
 * A parent asset that inflates a single child via the real `CoroutineScope.inflate` path — i.e.
 * `hydrationScope.launch { child.render() }` — exactly like production `inflateChild`. Used to
 * reproduce a parent re-render (which calls `renewHydrationScope`, cancelling its old
 * hydrationScope) cancelling an in-flight `child.render()` call that's still suspended deep
 * inside the child's own `render()` body (e.g. mid-`initView()`).
 *
 * The child is supplied directly as a [RenderableAsset] instance (not deserialized from asset
 * data) — `inflate()` only needs `child.assetContext` to rebuild a fresh copy via `.build()`, so
 * there's no need to route a nested [AnyAsset] field through the JS-bridge's contextual
 * serializer just to exercise the same `hydrationScope.launch { child.render() }` path.
 */
internal class SlowParentAsset(
    assetContext: AssetContext,
) : RenderableAsset<SlowParentAsset.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(val revision: Int = 0)

    val currentHydrationScope get() = hydrationScope

    var child: AnyAsset? = null

    /** A second, independent child (different asset id) inflated alongside [child]. */
    var sibling: AnyAsset? = null

    /** When true, hydrate() skips re-inflating [child] — only [sibling] is (re-)inflated. */
    var skipChildOnNextHydrate = false

    override suspend fun initView(data: Data): View {
        Log.e("SLOW_PARENT_DEBUG", "initView() revision=${data.revision}")
        return LinearLayout(requireContext())
    }

    override fun CoroutineScope.hydrate(view: View, data: Data) {
        require(view is LinearLayout)
        Log.e("SLOW_PARENT_DEBUG", "hydrate() ENTER revision=${data.revision} scope=$this")
        if (!skipChildOnNextHydrate) inflate(child, view)
        inflate(sibling, view)
        Log.e("SLOW_PARENT_DEBUG", "hydrate() EXIT revision=${data.revision}")
    }

    companion object {
        val sampleMap = mapOf(
            "id" to "slow-parent",
            "type" to "slow-parent",
        )

        val runtime = runtimeFactory.create()
        val sampleAsset = runtime.serialize(sampleMap) as Asset
        val sampleFlow = makeFlow(Json.encodeToJsonElement(GenericSerializer(), sampleMap))
    }
}
