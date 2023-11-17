package com.intuit.player.jvm.j2v8.extensions

import com.eclipsesource.v8.V8Value

internal fun <Context : V8Value> Context.unlock() = apply { runtime.locker.release() }
