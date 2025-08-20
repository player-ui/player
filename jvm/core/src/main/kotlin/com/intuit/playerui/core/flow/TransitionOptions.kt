package com.intuit.playerui.core.flow

import kotlinx.serialization.Serializable

/** Options used to change how transitions are handled */
@Serializable
public data class TransitionOptions(
    val force: Boolean = false,
) {
    public companion object {
        /** Singleton instance of [TransitionOptions] to force a transition */
        public val ForceTransition: TransitionOptions = TransitionOptions(true)
    }
}
