package com.intuit.player.jvm.core.player

/** All possible enumerations of player states */
public enum class PlayerFlowStatus(public val value: String) {
    NOT_STARTED("not-started"),
    IN_PROGRESS("in-progress"),
    COMPLETED("completed"),
    ERROR("error"),
    /** Only a JVM player state */
    RELEASED("released");

    public companion object {
        /** Flexibly and safely get the corresponding [PlayerFlowStatus] from the [value] */
        public fun from(value: Any?): PlayerFlowStatus = when (value) {
            NOT_STARTED.value -> NOT_STARTED
            IN_PROGRESS.value -> IN_PROGRESS
            COMPLETED.value -> COMPLETED
            RELEASED.value -> RELEASED
            else -> ERROR
        }
    }
}
