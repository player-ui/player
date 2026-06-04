package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.plugins.JSPluginWrapper
import com.intuit.playerui.core.plugins.LoggerPlugin
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

/** [JSPluginWrapper]s and [LoggerPlugin]s to configure a JS Player with */
@Serializable
public data class JSPlayerConfig(
    val plugins: List<JSPluginWrapper> = listOf(),
    @Transient val loggers: List<LoggerPlugin> = emptyList(),
    /**
     * Optional service factory map. Each entry serializes as a JS-callable
     * function. JS core invokes e.g. `config.services.data(ctx)` when
     * building the data controller; returning a `Node` substitutes the
     * default, returning `null` falls through.
     */
    /**
     * Service factories exposed to JS as `{ data: <fn>, ... }`. Declared as
     * `Invokable<String?>` purely to satisfy serialization (the return-type
     * serializer is unused on the encode path; see
     * [com.intuit.playerui.core.bridge.serialization.serializers.FunctionLikeSerializer.serialize]).
     * The actual lambda may return whatever shape JS expects (typically a
     * `Map<String, Any?>` mirroring `IDataController`). Adapter at
     * [com.intuit.playerui.core.player.ServicesConfig.toInvokableMap] does
     * the unchecked cast.
     */
    val services: Map<String, Invokable<String?>> = emptyMap(),
) {
    val logger: Map<String, Invokable<Unit>> = mapOf(
        "trace" to Invokable { args -> loggers.forEach { it.trace(*args) } },
        "debug" to Invokable { args -> loggers.forEach { it.debug(*args) } },
        "info" to Invokable { args -> loggers.forEach { it.info(*args) } },
        "warn" to Invokable { args -> loggers.forEach { it.warn(*args) } },
        "error" to Invokable { args -> loggers.forEach { it.error(*args) } },
    )
}
