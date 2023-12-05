package com.intuit.player.android.asset

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.view.View
import android.view.View.OnAttachStateChangeListener
import android.view.ViewGroup
import com.intuit.player.android.AssetContext
import com.intuit.player.android.R
import com.intuit.player.jvm.core.player.PlayerException
import com.intuit.player.jvm.core.player.state.inProgressState
import com.intuit.player.jvm.core.utils.InternalPlayerApi
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

    final override fun initView(): View = AsyncViewStub(
        hydrationScope,
        hydrationScope.async { doInitView() },
        requireContext(),
    ) { doHydrate(); player.cacheAssetView(assetContext, this) }

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
        try {
            hydrate(getData())
            setTag(R.bool.view_hydrated, true)
        } catch (exception: StaleViewException) {
            // b/c we're launched in a scope that isn't cared about anymore, we can't appropriately handle this, so just fast fail
            player.inProgressState?.fail(PlayerException("SuspendableAssets can't appropriately handle invalidateViews currently, this should be handled in a future major", exception))
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
            hydratedView.await()
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
