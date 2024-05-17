package com.intuit.playerui.core.flow

import com.intuit.playerui.core.flow.state.NavigationFlowState

/** Common interface describing the signature for transitioning between [NavigationFlowState] */
public interface Transition {

    /** Transition the view to a different [state]. [options] can be used to skip validation */
    public fun transition(state: String, options: TransitionOptions? = null)
}

/** Convenience helper to transition to [state] without running validations */
public fun Transition.forceTransition(state: String) {
    transition(state, TransitionOptions.ForceTransition)
}
