package com.intuit.playerui.plugins.context

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable

/**
 * Typed view of the aggregated `player.state` context entry. Read it with
 * `contextPlugin.get<PlayerStateContext>("player.state")`.
 *
 * Actions are scoped to the construct they operate on — [Flow.transition] and
 * [Data.set] — and are null until a flow is in-progress.
 */
@Serializable
public data class PlayerStateContext(
    val status: String? = null,
    val flow: Flow = Flow(),
    val view: View = View(),
    val data: Data = Data(),
    val validation: Validation = Validation(),
) {
    @Serializable
    public data class Flow(
        val id: String? = null,
        val state: String? = null,
        /** Transition the running flow using the given transition value (e.g. "Next"). */
        val transition: ((String) -> Unit)? = null,
    )

    @Serializable
    public data class View(
        val id: String? = null,
        val resolved: @Contextual Any? = null,
    )

    @Serializable
    public data class Data(
        val model: @Contextual Any? = null,
        /** Set a value in the data model at the given binding. */
        val set: ((String, @Contextual Any?) -> Unit)? = null,
    )

    /** Validation state for the running view, keyed by binding. */
    @Serializable
    public data class Validation(
        /** Whether the view has no blocking validations. */
        val canTransition: Boolean = true,
        /** Active validations per binding string. */
        val byBinding: Map<String, List<ContextValidation>> = emptyMap(),
    ) {
        @Serializable
        public data class ContextValidation(
            val severity: String,
            val message: String,
            val displayTarget: String? = null,
            @Contextual val blocking: Any? = null,
        )
    }
}
