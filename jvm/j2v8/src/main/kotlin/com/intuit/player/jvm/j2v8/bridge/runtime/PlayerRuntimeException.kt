package com.intuit.player.jvm.j2v8.bridge.runtime

import com.eclipsesource.v8.V8
import com.intuit.player.jvm.core.bridge.PlayerRuntimeException

internal fun PlayerRuntimeException(runtime: V8, message: String) = PlayerRuntimeException(runtime.let(::Runtime), message)
