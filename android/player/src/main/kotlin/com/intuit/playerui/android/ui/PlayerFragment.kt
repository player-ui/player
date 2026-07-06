package com.intuit.playerui.android.ui

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle.State
import androidx.lifecycle.LifecycleCoroutineScope
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.lifecycle.whenStarted
import androidx.transition.Transition
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.asset.asyncHydrationTrackerPlugin
import com.intuit.playerui.android.extensions.into
import com.intuit.playerui.android.extensions.transitionInto
import com.intuit.playerui.android.lifecycle.ManagedPlayerState
import com.intuit.playerui.android.lifecycle.ManagedPlayerState.Done
import com.intuit.playerui.android.lifecycle.ManagedPlayerState.Error
import com.intuit.playerui.android.lifecycle.ManagedPlayerState.NotStarted
import com.intuit.playerui.android.lifecycle.ManagedPlayerState.Pending
import com.intuit.playerui.android.lifecycle.ManagedPlayerState.Running
import com.intuit.playerui.android.lifecycle.PlayerViewModel
import com.intuit.playerui.android.lifecycle.fail
import com.intuit.playerui.core.bridge.PlayerRuntimeReleasedException
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.managed.FlowManager
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import kotlinx.coroutines.plus

/**
 * [Fragment] wrapper integration with the [AndroidPlayer]. Delegates
 * to an implementation of the [PlayerViewModel] for player management,
 * including hooking the player up to the fragment lifecycle.
 *
 * Subclasses will need to provide a [PlayerViewModel] implementation,
 * which requires a [FlowManager]. For pre-defined flow use case,
 * the subclass can use the [FlowManager] pseudo constructor
 * for convenience.
 *
 * // TODO: Check this
 * By default, the [PlayerViewModel] will be started as soon as the
 * [Context] is attached to the [Fragment] in [onAttach]. When
 * [onDestroyView] is invoked, [PlayerViewModel.recycle] is called to
 * clear any Android lifecycle specific cached data.
 *
 * Additionally, this automatically observes all [ManagedPlayerState]
 * changes and calls into the corresponding [ManagedPlayerState.Listener]
 * handlers. [buildLoadingView] and [buildFallbackView] are used to
 * build views for when the [PlayerViewModel] is pending the next view
 * or encountered an error. These methods do have default implementations
 * to enable consumers to plug-n-play, but can be overridden to customize
 * the UI in these states.
 */
public abstract class PlayerFragment :
    Fragment(),
    ManagedPlayerState.Listener {
    /** [LifecycleCoroutineScope.launchWhenStarted] extension for waiting on [AndroidPlayer] instance */
    @ExperimentalPlayerApi
    protected fun LifecycleCoroutineScope.launchWhenReady(block: suspend CoroutineScope.(player: AndroidPlayer) -> Unit) {
        launchWhenStarted {
            block(playerViewModel.deferredPlayer.await())
        }
    }

    private var _binding: PlayerBinding? = null

    /**
     * [PlayerBinding] instance
     * This property is only valid between onCreateView and onDestroyView.
     * Will throw a NPE if called out of turn.
     */
    protected val binding: PlayerBinding get() = _binding!!

    /**
     * [ViewModel][androidx.lifecycle.ViewModel] responsible for managing an [AndroidPlayer]
     * with respect to a specific [FlowManager][com.intuit.playerui.core.managed.FlowManager].
     */
    public abstract val playerViewModel: PlayerViewModel

    private var renderingJob: Job? = null

    init {
        lifecycleScope.launch {
            repeatOnLifecycle(State.STARTED) {
                // forward started flows to the callback
                playerViewModel.startedFlows
                    .onEach { onStartedFlow(it) }
                    .launchIn(this + Dispatchers.Default)

                // forward state events to callbacks
                playerViewModel.state
                    .onEach {
                        try {
                            when (it) {
                                NotStarted -> onNotStarted()
                                Pending -> onPending()
                                is Running -> onRunning(it)
                                is Error -> onError(it)
                                is Done -> onDone(it)
                            }
                        } catch (exception: PlayerRuntimeReleasedException) {
                            // If the runtime is released async (via viewModel.destroy()), swallow runtime exception
                        }
                    }.launchIn(this + Dispatchers.Default)

                // update UI for latest state
                playerViewModel.state.collectLatest {
                    when (it) {
                        NotStarted, Pending -> buildLoadingView() into binding.playerCanvas
                        is Running -> try {
                            handleAssetUpdate(it.asset, it.animateViewTransition)
                        } catch (exception: Exception) {
                            if (exception is CancellationException) throw exception
                            exception.printStackTrace()
                            playerViewModel.fail("Error rendering asset", exception)
                        }

                        is Error -> buildFallbackView(it.exception) into binding.playerCanvas
                        is Done -> buildDoneView() into binding.playerCanvas
                    }
                }
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View = PlayerBinding.inflate(inflater, container, false).run {
        _binding = this
        root
    }

    override fun onDestroyView() {
        // recycle views
        _binding = null
        playerViewModel.recycle()
        super.onDestroyView()
    }

    /** Reset the [PlayerViewModel.manager] from the beginning */
    public fun reset() {
        playerViewModel.start()
    }

    /** Default implementation of [handleAssetUpdate] */
    @ExperimentalPlayerApi
    protected open fun CoroutineScope.renderIntoPlayerCanvas(asset: RenderableAsset<*>?, animateTransition: Boolean) {
        val startTime = System.currentTimeMillis()
        val tracker = asset?.player?.asyncHydrationTrackerPlugin

        tracker?.hooks?.onHydrationComplete?.tap("renderIntoPlayerCanvas-timing") {
            playerViewModel.logRenderTime(asset, System.currentTimeMillis() - startTime)
        }

        if (asset is RenderableAsset.ViewportAsset) binding.scrollContainer.isFillViewport = true

        val context = requireContext()
        val transition = if (animateTransition) buildTransitionAnimation() else null
        if (transition != null) {
            binding.scrollContainer.scrollTo(0, 0)
            val offscreen = FrameLayout(context)
            tracker?.hooks?.onHydrationComplete?.tap("renderIntoPlayerCanvas-transition") {
                val child = offscreen.getChildAt(0)
                child.transitionInto(binding.playerCanvas, transition)
            }
            asset?.run { renderInto(offscreen, context) }
        } else {
            asset?.run { renderInto(binding.playerCanvas, context) }
                ?: run { null into binding.playerCanvas }
        }
    }

    /**
     * Handle [asset] updates from the [PlayerViewModel]. By default,
     * this will invoke [RenderableAsset.renderInto] and inject that into the view tree.
     */
    protected open fun handleAssetUpdate(asset: RenderableAsset<*>?, animateTransition: Boolean) {
        renderingJob?.cancel("handling new update")
        renderingJob = lifecycleScope.launch {
            whenStarted {
                try {
                    renderIntoPlayerCanvas(asset, animateTransition)
                } catch (exception: Exception) {
                    if (exception is CancellationException) throw exception
                    exception.printStackTrace()
                    playerViewModel.fail("Error rendering asset", exception)
                }
            }
        }
    }

    public open fun buildTransitionAnimation(): Transition? = null

    /**
     * Builder method to provide a [View] to be shown when the [PlayerViewModel] is loading, which can be either
     * [NotStarted][ManagedPlayerState.NotStarted] or[Pending][ManagedPlayerState.Pending] the next flow.
     * Defaults to simple [ProgressBar].
     */
    public open fun buildLoadingView(): View? = ProgressBar(context)

    /**
     * Builder method to provide a fallback [View] to be shown when the
     * [PlayerViewModel] encounters an [exception]. Defaults to an instance of [FallbackBinding].
     */
    public open fun buildFallbackView(exception: Exception): View? = FallbackBinding
        .inflate(layoutInflater)
        .apply {
            this.error.text = exception.localizedMessage

            retry.setOnClickListener {
                playerViewModel.retry()
            }

            reset.setOnClickListener {
                reset()
            }
        }.getRoot()

    /**
     * Builder method to provide a [View] to be shown when the [PlayerViewModel]
     * finishes. Defaults to null.
     */
    public open fun buildDoneView(): View? = null
}
