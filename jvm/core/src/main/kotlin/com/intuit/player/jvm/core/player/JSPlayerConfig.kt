package com.intuit.player.jvm.core.player

import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.plugins.JSPluginWrapper
import com.intuit.player.jvm.core.plugins.LoggerPlugin
import kotlinx.serialization.Serializable

/** [JSPluginWrapper]s and [LoggerPlugin]s to configure a JS Player with */
@Serializable
public data class JSPlayerConfig(
    val plugins: List<JSPluginWrapper> = listOf(),
    @Transient val loggers: List<LoggerPlugin> = emptyList(),
) {
    val logger: Map<String, Invokable<Unit>> = mapOf(
        "trace" to Invokable { args -> loggers.forEach { it.trace(*args) } },
        "debug" to Invokable { args -> loggers.forEach { it.debug(*args) } },
        "info" to Invokable { args -> loggers.forEach { it.info(*args) } },
        "warn" to Invokable { args -> loggers.forEach { it.warn(*args) } },
        "error" to Invokable { args -> loggers.forEach { it.error(*args) } },
    )
}
