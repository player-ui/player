package com.intuit.playerui.core.flow

import com.intuit.playerui.core.expressions.Expression
import com.intuit.playerui.core.flow.state.NavigationFlowState
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

/** A state machine in the navigation */
@Serializable
public data class NavigationFlow(
    val startState: String,
    val onStart: Expression?,
    @Transient
    val states: Map<String, NavigationFlowState>? = null,
)
