package com.intuit.playerui.hermes.extensions

import com.intuit.playerui.jsi.Value

internal fun Value.mapUndefinedToNull() =
    if (isUndefined() || isNull()) null else this

internal fun <Container> Value.mapToContainer(constructor: (Value) -> Container) =
    mapUndefinedToNull()?.let(constructor)
