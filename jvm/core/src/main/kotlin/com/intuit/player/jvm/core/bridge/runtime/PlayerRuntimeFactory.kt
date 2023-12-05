package com.intuit.player.jvm.core.bridge.runtime

import java.util.ServiceLoader

/** Factory of [Runtime] with a specific [T] of [PlayerRuntimeConfig] */
public interface PlayerRuntimeFactory<out T : PlayerRuntimeConfig> {
    /** Creates a new [Runtime] optionally specifying a [block] configuring [T] */
    public fun create(block: T.() -> Unit = {}): Runtime<*>
}

/**
 * Creates a new [PlayerRuntimeFactory] based on this one
 * with further configurations from the [nested] block.
 */
public fun <T : PlayerRuntimeConfig> PlayerRuntimeFactory<T>.config(
    nested: T.() -> Unit,
): PlayerRuntimeFactory<T> {
    val parent = this

    return object : PlayerRuntimeFactory<T> {
        override fun create(block: T.() -> Unit): Runtime<*> = parent.create {
            nested()
            block()
        }
    }
}

/** Workaround for dummy android [ClassLoader] */
public val runtimeContainers: List<PlayerRuntimeContainer> = PlayerRuntimeContainer::class.java.let {
    ServiceLoader.load(it, it.classLoader).toList()
}

/** Default [PlayerRuntimeFactory] to use if none are specified */
public val runtimeFactory: PlayerRuntimeFactory<*> = runtimeContainers.firstOrNull()?.factory ?: error(
    "Failed to find JS Player runtime implementation in the classpath: consider adding player runtime dependency. " +
        "See https://TODO",
)
