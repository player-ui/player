package com.intuit.playerui.hermes.bridge.runtime

import com.intuit.playerui.core.bridge.PlayerRuntimeException

internal fun PlayerRuntimeException(runtime: HermesRuntime, message: String, cause: Throwable? = null) = PlayerRuntimeException(runtime, message, cause)
