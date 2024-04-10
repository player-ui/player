package com.intuit.playerui.j2v8.bridge.runtime

import com.eclipsesource.v8.V8
import com.intuit.playerui.core.bridge.PlayerRuntimeException

internal fun PlayerRuntimeException(runtime: V8, message: String) = PlayerRuntimeException(runtime.let(::Runtime), message)
