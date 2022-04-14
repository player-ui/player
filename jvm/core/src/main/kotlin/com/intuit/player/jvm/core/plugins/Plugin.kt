package com.intuit.player.jvm.core.plugins

import com.intuit.player.jvm.core.player.Player

/** Semantic designation that implementations of this will be used to configure some other construct */
public interface Plugin

/**
 * Helper to find the first instance of a specific [Plugin] registered to the [Player].
 * It will log a warning and return null if not found.
 */
public inline fun <reified T : Plugin> Player.findPlugin(): T? = plugins
    .filterIsInstance<T>()
    .firstOrNull()
    ?: warnPluginNotFound(T::class.java.simpleName)

/** Helper to log a warning if a plugin is not found and return nullable [T] as null */
public fun <T : Plugin> Player.warnPluginNotFound(plugin: String): T? {
    logger.warn("$plugin not found")
    return null
}
