package com.intuit.playerui.core.bridge.runtime
import kotlinx.coroutines.CoroutineExceptionHandler

/** Base configuration for [Runtime] */
public open class PlayerRuntimeConfig {
    public open var debuggable: Boolean = false
    public open var coroutineExceptionHandler: CoroutineExceptionHandler? = null
    public open var timeout: Long = if (debuggable) Int.MAX_VALUE.toLong() else 5000
}
