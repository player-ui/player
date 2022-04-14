package com.intuit.player.android.lifecycle

import android.app.Application
import androidx.lifecycle.*
import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.AndroidPlayerPlugin
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.experimental.ExperimentalPlayerApi
import com.intuit.player.jvm.core.managed.AsyncFlowIterator
import com.intuit.player.jvm.core.managed.AsyncIterationManager
import com.intuit.player.jvm.core.managed.FlowManager
import com.intuit.player.jvm.core.player.PlayerException
import com.intuit.player.jvm.core.player.state.*
import com.intuit.player.jvm.core.plugins.Plugin
import com.intuit.player.jvm.core.plugins.RuntimePlugin
import com.intuit.player.plugins.beacon.onBeacon
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * Android lifecycle-aware player manager that integrates and manages
 * state between a [FlowManager] and an [AndroidPlayer]. This sta
 *
 * As-is, this bare-bones implementation does not include any additional
 * plugins, meaning that any flows will not actually expand into
 * [RenderableAsset]s. It is intended to subclass [PlayerViewModel],
 * overriding [plugins] to provide the app specific UI functionality.
 *
 * Additional plugin functionality can be configured by overriding [apply]
 * and tapping plugin hooks. However, it is important to remember to invoke
 * the super method unless, explicitly modifying the existing behaviors.
 */
@OptIn(ExperimentalPlayerApi::class)
public open class PlayerViewModel(flows: AsyncFlowIterator) : ViewModel(), AndroidPlayerPlugin, RuntimePlugin {

    /**
     * Collection of [Plugin]s to configure the [player] with.
     *
     * The [PlayerViewModel] is an [AndroidPlayerPlugin] implementation,
     * but will be explicitly included by default and does not need
     * to be included here.
     */
    protected open val plugins: List<Plugin> = emptyList()

    // TODO: accessing non-final fields in constructor -- must not use player before init is done
    //  This could be fixed by requiring [plugins] be in the constructor, but this is kinda
    //  backwards since subclasses are required to configure plugin behavior manually. Maybe
    //  apps just supply a meta plugin to configure things? Although, the reason for configuring
    //  plugins here is to potentially hook into the fragment. External actions is a great
    //  example, where the app needs to actually load a different native experience outside the
    //  player scope. Not sure how to solve this. Maybe a player factory instead that requires
    //  the [PlayerViewModel] to be finished initialization?
    protected val player: AndroidPlayer by lazy {
        AndroidPlayer(plugins + this)
    }

    protected val manager: FlowManager = FlowManager(flows)

    private lateinit var runtime: Runtime<*>

    private var _state = MutableStateFlow<ManagedPlayerState>(ManagedPlayerState.NotStarted)
    private val _beacons = MutableSharedFlow<String>()

    public val state: StateFlow<ManagedPlayerState> get() = _state.asStateFlow()
    public val beacons: SharedFlow<String> get() = _beacons.asSharedFlow()

    init {
        // next() TODO: If we fix the non-final field error, we can prefetch here
        viewModelScope.launch {
            manager.state.collect {
                when (it) {
                    AsyncIterationManager.State.NotStarted -> _state.emit(ManagedPlayerState.NotStarted)
                    AsyncIterationManager.State.Pending -> _state.emit(ManagedPlayerState.Pending)
                    AsyncIterationManager.State.Done -> _state.emit(ManagedPlayerState.Done(player.completedState))
                    is AsyncIterationManager.State.Item<*> -> start(it.value as String)
                    is AsyncIterationManager.State.Error -> _state.emit(ManagedPlayerState.Error(it.error)) // player.fail()
                }
            }
        }
    }

    private fun start(flow: String) = player.start(flow) {
        when {
            it.isSuccess -> player.logger.info(
                "Flow completed successfully!",
                it.getOrNull()?.endState
            )
            it.isFailure -> player.logger.error(
                "Error in Flow!",
                it.exceptionOrNull()
            )
        }
    }

    override fun apply(androidPlayer: AndroidPlayer) {
        androidPlayer.onUpdate { renderableAsset, animateTransition ->
            player.logger.info("currentView = {id=${renderableAsset?.asset?.id},type=${renderableAsset?.asset?.type}}")
            _state.tryEmit(ManagedPlayerState.Running(renderableAsset, animateTransition))
        }

        androidPlayer.onBeacon { beacon ->
            player.logger.info("beacon = {$beacon}}")
            _beacons.tryEmit(beacon)
        }

        androidPlayer.hooks.state.tap { state ->
            player.logger.info("state = {${state?.status}}")
            when (state) {
                is NotStartedState -> _state.tryEmit(ManagedPlayerState.NotStarted)
                // When player completes, we try to get the next flow from the manager,
                // which will either start a new flow or transition to done
                is CompletedState -> manager.next(state)
                is ErrorState -> _state.tryEmit(ManagedPlayerState.Error(state.error))
            }
        }
    }

    override fun apply(runtime: Runtime<*>) {
        this.runtime = runtime
    }

    override fun onCleared() {
        runtime.scope.launch {
            if (manager.state.value != AsyncIterationManager.State.Done) manager.iterator.terminate()
            release()
        }
    }

    public fun recycle() {
        player.logger.debug("PlayerViewModel: recycling player")
        player.recycle()
    }

    public fun release() {
        player.logger.debug("PlayerViewModel: releasing player")
        player.release()
    }

    internal fun logRenderTime(asset: RenderableAsset, completionTime: Long) {
        player.logger.debug("$asset with ID ${asset.asset.id} took ${completionTime}ms to render and display on screen")
    }

    /** Start the [manager] from the first flow */
    public fun start() {
        manager.next()
    }

    /** Reruns the current flow, in the case of an error. Has no effect once the iterator has finished or is currently pending an item */
    public fun retry() {
        when (state.value) {
            ManagedPlayerState.NotStarted -> manager.next()
            is ManagedPlayerState.Error,
            is ManagedPlayerState.Running -> when (val currentFlow = manager.state.value) {
                AsyncIterationManager.State.NotStarted -> manager.next()
                is AsyncIterationManager.State.Item<*> -> start(currentFlow.value as String)
                // try to re-retrieve the next flow from the previous state
                is AsyncIterationManager.State.Error -> manager.next(player.completedState)
            }
        }
    }

    public fun fail(cause: Throwable) {
        player.inProgressState?.fail(cause)
    }

    /** Helper to progress the [FlowManager] in within the [viewModelScope] */
    private fun FlowManager.next(completedState: CompletedState? = null) {
        viewModelScope.next(completedState)
    }

    /** Generic [ViewModelProvider.AndroidViewModelFactory] to conveniently construct some [T] with an [Application] and [AsyncFlowIterator] */
    public class Factory<T : PlayerViewModel>(
        private val iterator: AsyncFlowIterator,
        private val factory: (AsyncFlowIterator) -> T = { i -> PlayerViewModel(i) as T }
    ) : ViewModelProvider.Factory {

        override fun <T : ViewModel?> create(modelClass: Class<T>): T {
            return factory(iterator).apply(PlayerViewModel::start) as T
        }
    }
}

public inline fun PlayerViewModel.fail(message: String, cause: Throwable? = null) {
    fail(PlayerException(message, cause))
}
