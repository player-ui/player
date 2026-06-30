package com.intuit.playerui.plugins.context

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.deserialize
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable

/** A frozen snapshot of the context store captured when a flow ends. */
@Serializable
public data class FrozenContextSnapshot(
    val flowId: String? = null,
    val endedAt: Double,
    val entries: List<FrozenContextEntry> = emptyList(),
) {
    @Serializable
    public data class FrozenContextEntry(
        val name: String? = null,
        val description: String,
        /**
         * The frozen value. Not part of the public surface — read entries with
         * [get] for typed, cross-platform-consistent access.
         */
        @PublishedApi internal val value: @Contextual Any? = null,
    )

    /**
     * Read a frozen entry by its key [name], deserialized into [T] — the same
     * typed access as live context. Returns null if the entry was absent when
     * the snapshot froze. Function-valued entries return their tombstone (a
     * callable that throws when invoked).
     */
    public inline fun <reified T> get(name: String): T? = when (val value = entries.firstOrNull { it.name == name }?.value) {
        null -> null
        is Node -> value.deserialize<T>()
        else -> value as T
    }
}
