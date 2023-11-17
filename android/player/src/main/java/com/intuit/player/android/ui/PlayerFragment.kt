package com.intuit.player.android.ui

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import androidx.core.view.doOnLayout
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.transition.Transition
import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.android.databinding.DefaultFallbackBinding
import com.intuit.player.android.databinding.FragmentPlayerBinding
import com.intuit.player.android.extensions.into
import com.intuit.player.android.extensions.transitionInto
import com.intuit.player.android.lifecycle.ManagedPlayerState
import com.intuit.player.android.lifecycle.PlayerViewModel
import com.intuit.player.android.lifecycle.fail
import com.intuit.player.jvm.core.managed.AsyncFlowIterator
import kotlinx.coroutines.flow.collect

/**
 * [Fragment] wrapper integration with the [AndroidPlayer]. Delegates
 * to an implementation of the [PlayerViewModel] for player management,
 * including hooking the player up to the fragment lifecycle.
 *
 * Subclasses will need to provide a [PlayerViewModel] implementation,
 * which requires an [AsyncFlowIterator]. For pre-defined flow use case,
 * the subclass can use the [AsyncFlowIterator] pseudo constructor
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
public abstract class PlayerFragment : Fragment(), ManagedPlayerState.Listener {

    private var _binding: FragmentPlayerBinding? = null

    /**
     * [FragmentPlayerBinding] instance
     * This property is only valid between onCreateView and onDestroyView.
     * Will throw a NPE if called out of turn.
     */
    protected val binding: FragmentPlayerBinding get() = _binding!!

    /**
     * [ViewModel][androidx.lifecycle.ViewModel] responsible for managing an [AndroidPlayer]
     * with respect to a specific [FlowManager][com.intuit.player.jvm.core.managed.FlowManager].
     */
    public abstract val playerViewModel: PlayerViewModel

    init {
        lifecycleScope.launchWhenStarted {
            playerViewModel.state.collect {
                when (it) {
                    ManagedPlayerState.NotStarted -> {
                        buildLoadingView() into binding.playerCanvas
                        onNotStarted()
                    }

                    ManagedPlayerState.Pending -> {
                        buildLoadingView() into binding.playerCanvas
                        onPending()
                    }

                    is ManagedPlayerState.Running -> {
                        try {
                            handleAssetUpdate(it.asset, it.animateViewTransition)
                            onRunning(it)
                        } catch (exception: Exception) {
                            exception.printStackTrace()
                            playerViewModel.fail("Error rendering asset", exception)
                        }
                    }

                    is ManagedPlayerState.Error -> {
                        buildFallbackView(it.exception) into binding.playerCanvas
                        onError(it)
                    }

                    is ManagedPlayerState.Done -> {
                        buildDoneView() into binding.playerCanvas
                        onDone(it)
                    }
                }
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View = FragmentPlayerBinding.inflate(inflater, container, false).run {
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

    /**
     * Handle [asset] updates from the [PlayerViewModel]. By default,
     * this will invoke [RenderableAsset.render] with no additional
     * styles and inject that into the view tree.
     */
    protected open fun handleAssetUpdate(asset: RenderableAsset?, animateTransition: Boolean) {
        val startTime = System.currentTimeMillis()
        if (asset is RenderableAsset.ViewportAsset) binding.scrollContainer.isFillViewport = true
        val view = asset?.render(requireContext())?.also {
            it.doOnLayout { playerViewModel.logRenderTime(asset, System.currentTimeMillis() - startTime) }
        }
        if (animateTransition) {
            binding.root.scrollTo(0, 0)
            buildTransitionAnimation()?.let {
                view.transitionInto(binding.playerCanvas, it)
                return
            }
        }
        view into binding.playerCanvas
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
     * [PlayerViewModel] encounters an [exception]. Defaults to an instance of [DefaultFallbackBinding].
     */
    public open fun buildFallbackView(exception: Exception): View? =
        DefaultFallbackBinding.inflate(layoutInflater).apply {
            this.error.text = exception.localizedMessage

            retry.setOnClickListener {
                playerViewModel.retry()
            }

            reset.setOnClickListener {
                reset()
            }
        }.root

    /**
     * Builder method to provide a [View] to be shown when the [PlayerViewModel]
     * finishes. Defaults to null.
     */
    public open fun buildDoneView(): View? = null
}
