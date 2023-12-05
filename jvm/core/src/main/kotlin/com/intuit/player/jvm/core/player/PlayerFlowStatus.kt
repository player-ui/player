package com.intuit.player.jvm.core.player

/** All possible enumerations of player states */
public enum class PlayerFlowStatus(public val value: String) {
    NOT_STARTED("not-started"),
    IN_PROGRESS("in-progress"),
    COMPLETED("completed"),
    ERROR("error"),

    /** Only a JVM player state */
    RELEASED("released"),
}
