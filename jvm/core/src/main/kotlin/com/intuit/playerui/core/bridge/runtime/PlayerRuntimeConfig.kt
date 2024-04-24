package com.intuit.playerui.core.bridge.runtime

import kotlinx.coroutines.CoroutineExceptionHandler

/** Base configuration for [Runtime] */
public open class PlayerRuntimeConfig {
    public open var debuggable: Boolean = false
    public open var coroutineExceptionHandler: CoroutineExceptionHandler? = null
}
