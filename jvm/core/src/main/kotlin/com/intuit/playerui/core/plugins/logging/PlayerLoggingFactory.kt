package com.intuit.playerui.core.plugins.logging

import com.intuit.playerui.core.plugins.LoggerPlugin
import java.util.*

/** Factory of [Logging] with a specific [T] of [PlayerLoggingConfig] */
public interface PlayerLoggingFactory<out T : PlayerLoggingConfig> {
    /** Creates a new [Logging] optionally specifying a [block] configuring [T] */
    public fun create(block: T.() -> Unit = {}): LoggerPlugin
}

/**
 * Creates a new [PlayerRuntimeFactory] based on this one
 * with further configurations from the [nested] block.
 */
public fun <T : PlayerLoggingConfig> PlayerLoggingFactory<T>.config(
    nested: T.() -> Unit,
): PlayerLoggingFactory<T> {
    val parent = this

    return object : PlayerLoggingFactory<T> {
        override fun create(block: T.() -> Unit): LoggerPlugin = parent.create {
            nested()
            block()
        }
    }
}

/** Workaround for dummy android [ClassLoader] */
public val loggerContainers: List<PlayerLoggingContainer> = PlayerLoggingContainer::class.java.let {
    ServiceLoader.load(it, it.classLoader).toList()
}

/** Default [PlayerLoggingFactory] to use if none are specified */
public val loggers: List<LoggerPlugin> = loggerContainers.map { it.factory.create() }

/** Instantiate and configure all [LoggerPlugin]s */
public fun loggers(block: PlayerLoggingConfig.() -> Unit): List<LoggerPlugin> = loggerContainers.map { it.factory.create(block) }
