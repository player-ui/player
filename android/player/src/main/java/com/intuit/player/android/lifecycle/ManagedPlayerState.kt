package com.intuit.player.android.lifecycle

import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.jvm.core.managed.AsyncIterationManager
import com.intuit.player.jvm.core.player.state.CompletedState
import com.intuit.player.jvm.core.player.state.PlayerFlowState

/** State of a managed player which serves as an aggregation of the players [state][PlayerFlowState] and the managers [state][AsyncIterationManager.State] */
public sealed class ManagedPlayerState {
    /** Initial state of the [PlayerViewModel] */
    public object NotStarted : ManagedPlayerState()
    /** State that represents any error encountered when instantiating a player, retrieving a flow, or running a flow */
    public data class Error(public val exception: Exception) : ManagedPlayerState()
    /** [Pending] represents the time spent retrieving a flow, either before any flow or after the [AndroidPlayer] reaches the [CompletedState] */
    public object Pending : ManagedPlayerState()
    /** State containing the current [asset] representation of the current in-progress flow */
    public data class Running(public val asset: RenderableAsset?, public val animateViewTransition: Boolean) : ManagedPlayerState()
    /** The [PlayerViewModel] reaches the [Done] state once the [PlayerViewModel.manager] has no more flows to produce */
    public data class Done(public val completedState: CompletedState?) : ManagedPlayerState()

    public interface Listener {
        /** Handler that is invoked when the [PlayerViewModel] reaches the [NotStarted] state */
        public fun onNotStarted() {}

        /** Handler that is invoked when the [PlayerViewModel] is [Pending] the next view */
        public fun onPending() {}

        /** Handler that is invoked when the [PlayerViewModel] reaches an [Running] state */
        public fun onRunning(inProgressState: Running) {}

        /** Handler that is invoked when the [PlayerViewModel] reaches the [Done] state */
        public fun onDone(doneState: Done) {}

        /** Handler that is invoked when the [PlayerViewModel] encounters an [Error] */
        public fun onError(errorState: Error) {}
    }
}
