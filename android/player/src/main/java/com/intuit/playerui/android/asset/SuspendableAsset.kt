package com.intuit.playerui.android.asset

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.view.View
import android.view.View.OnAttachStateChangeListener
import android.view.ViewGroup
import androidx.core.view.children
import com.intuit.hooks.HookContext
import com.intuit.hooks.SyncHook
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayerPlugin
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.R
import com.intuit.playerui.android.asset.SuspendableAsset.AsyncHydrationTrackerPlugin
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.plugins.findPlugin
import com.intuit.playerui.core.utils.InternalPlayerApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlin.coroutines.cancellation.CancellationException
import kotlin.coroutines.coroutineContext

/** Extension of [DecodableAsset] that provides suspendable [initView] and [hydrate] APIs that will provide an instance of [Data] to use during [View] updates */
public abstract class SuspendableAsset<Data>(assetContext: AssetContext, serializer: KSerializer<Data>) : DecodableAsset<Data>(assetContext, serializer) {

    // To be launched in Dispatchers.Default
    public abstract suspend fun initView(data: Data): View

    final override fun initView(): View {
        // ensure we pre-track hydration to ensure all assets are accounted for during async hydration
        player.asyncHydrationTrackerPlugin?.hydrationDone(this@SuspendableAsset)
        return AsyncViewStub(
            hydrationScope,
            hydrationScope.async { doInitView() },
            requireContext(),
        ) { doHydrate(); player.cacheAssetView(assetContext, this) }
    }

    private suspend fun doInitView() = withContext(Dispatchers.Default) {
        initView(getData()).apply { setTag(R.bool.view_hydrated, false) }
    }

    // To be launched in Dispatchers.Main
    public abstract suspend fun View.hydrate(data: Data)

    final override fun View.hydrate() {
        if (this is AsyncViewStub) return

        setTag(R.bool.view_hydrated, false)
        hydrationScope.launch(Dispatchers.Main) { doHydrate() }
    }

    private suspend fun View.doHydrate() = withContext(Dispatchers.Main) {
        player.asyncHydrationTrackerPlugin?.trackHydration(this@SuspendableAsset)
        try {
            hydrate(getData())
            setTag(R.bool.view_hydrated, true)
        } catch (exception: StaleViewException) {
            // b/c we're launched in a scope that isn't cared about anymore, we can't appropriately handle this, so just fast fail
            player.inProgressState?.fail(PlayerException("SuspendableAssets can't appropriately handle invalidateViews currently, this should be handled in a future major", exception))
        } finally {
            player.asyncHydrationTrackerPlugin?.hydrationDone(this@SuspendableAsset)
        }
    }

    @ExperimentalPlayerApi
    public class AsyncHydrationTrackerPlugin : AndroidPlayerPlugin {
        private var trackedHydrations = mutableSetOf<String>()

        public val hooks: Hooks = Hooks()

        public fun trackHydration(asset: SuspendableAsset<*>) {
            synchronized(trackedHydrations) {
                trackedHydrations.add(asset.assetContext.id)
            }
        }

        public fun hydrationDone(asset: SuspendableAsset<*>) {
            val doneHydrating = synchronized(trackedHydrations) {
                trackedHydrations.remove(asset.assetContext.id)
                trackedHydrations.isEmpty()
            }

            if (doneHydrating) {
                hooks.onHydrationComplete.call()
            }
        }

        override fun apply(androidPlayer: AndroidPlayer) {
            androidPlayer.onUpdate { _, _ ->
                synchronized(trackedHydrations) {
                    trackedHydrations.clear()
                }
            }
        }

        public class Hooks {
            public class OnHydrationCompleteHook : SyncHook<(HookContext) -> Unit>() {
                public fun call(): Unit = super.call { f, context ->
                    f(context)
                }
            }

            public val onHydrationComplete: OnHydrationCompleteHook = OnHydrationCompleteHook()
        }
    }

    /** ViewStub derivative that will replace itself in the view tree once the [view] has resolved */
    @SuppressLint("ViewConstructor")
    @InternalPlayerApi
    public class AsyncViewStub @JvmOverloads constructor(
        private val scope: CoroutineScope,
        private val view: Deferred<View>,
        context: Context,
        attrs: AttributeSet? = null,
        defStyle: Int = 0,
        private val onView: suspend View.() -> Unit = {},
    ) : View(context, attrs, defStyle), OnAttachStateChangeListener {

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
                awaitView()?.let(::replaceSelfWithView)
            }
        }

        override fun onViewDetachedFromWindow(v: View) {}

        override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
            setMeasuredDimension(0, 0)
        }

        @SuppressLint("MissingSuperCall")
        override fun onAttachedToWindow() {}

        @SuppressLint("MissingSuperCall")
        override fun draw(canvas: Canvas?) {}

        override fun dispatchDraw(canvas: Canvas?) {}

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

public val AndroidPlayer.asyncHydrationTrackerPlugin: AsyncHydrationTrackerPlugin? get() = findPlugin()
