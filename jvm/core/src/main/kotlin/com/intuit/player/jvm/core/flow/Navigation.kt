package com.intuit.player.jvm.core.flow

import kotlinx.serialization.Serializable

// TODO: We probably have to implement a custom serializer to
//  store the unknown key-values. This is preventing the
//  player from reasonably assuming the start API can rely
//  on the entire flow being deserialized properly.
/** The navigation section of the flow describes a State Machine for the user */
@Serializable
public data class Navigation(
    val BEGIN: String,
    val flows: Map<String, NavigationFlow> = emptyMap()
)
