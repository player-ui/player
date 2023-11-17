package com.intuit.player.jvm.core.bridge.runtime

import kotlinx.coroutines.CoroutineExceptionHandler

/** Base configuration for [Runtime] */
public open class PlayerRuntimeConfig {
    public open var coroutineExceptionHandler: CoroutineExceptionHandler? = null
}
