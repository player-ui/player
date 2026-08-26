package com.intuit.playerui.plugins.context

import kotlinx.serialization.Serializable

/** Descriptor for a registered context entry, as returned by [ContextPlugin.list]. */
@Serializable
public data class ContextEntryDescriptor(
    val description: String,
    val hasValue: Boolean = false,
    val hasTransform: Boolean = false,
)
