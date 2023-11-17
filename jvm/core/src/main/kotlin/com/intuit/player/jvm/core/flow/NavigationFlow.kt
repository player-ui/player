package com.intuit.player.jvm.core.flow

import com.intuit.player.jvm.core.expressions.Expression
import com.intuit.player.jvm.core.flow.state.NavigationFlowState
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
