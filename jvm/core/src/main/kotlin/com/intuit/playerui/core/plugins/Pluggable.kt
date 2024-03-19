package com.intuit.playerui.core.plugins

/** Describes a construct that is inherently configurable via [Plugin]s */
public interface Pluggable {

    /** Collection of [Plugin]s that are registered to this instance */
    public val plugins: List<Plugin>
}

/**
 * Helper to find the first instance of a specific [Plugin] registered to the [Pluggable].
 * It will attempt to log a warning using the [logger] and return null if not found.
 */
public inline fun <reified T : Plugin> Pluggable.findPlugin(): T? = plugins
    .filterIsInstance<T>()
    .firstOrNull()
    .also { it ?: logger?.warn("${T::class.java.simpleName} not found") }
