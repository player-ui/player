package com.intuit.player.jvm.j2v8.extensions

import com.eclipsesource.v8.V8Value

internal fun <Runtime : V8Value> Runtime.mapUndefinedToNull() =
    if (isUndefined) null else this

internal fun <Runtime : V8Value, Container> Runtime.mapToContainer(constructor: (Runtime) -> Container) =
    mapUndefinedToNull()?.let(constructor)
