package com.intuit.player.plugins.settimeout

import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.runtime.add
import com.intuit.player.jvm.core.plugins.RuntimePlugin
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** [RuntimePlugin] that adds a `setTimeout` implementation into a the [Runtime] if it doesn't exist */
public class SetTimeoutPlugin : RuntimePlugin {

    override fun apply(runtime: Runtime<*>) {
        if (!runtime.contains("setTimeout")) runtime.add("setTimeout") { callback: Invokable<Any?>, timeout: Double ->
            runtime.scope.launch {
                delay(timeout.toLong())
                callback()
            }
            return@add
        }
    }
}
