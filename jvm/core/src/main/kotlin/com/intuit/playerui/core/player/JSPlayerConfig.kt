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
     * Service factories exposed to JS as `{ data: <fn>, ... }`. Each factory
     * returns the service it produces (the data factory returns a
     * `Map<String, Any?>` mirroring `IDataController`), hence `Invokable<Any?>`.
     * Only the encode path runs (Kotlin -> JS); it serializes the function and
     * ignores the return-type serializer (see
     * [com.intuit.playerui.core.bridge.serialization.serializers.FunctionLikeSerializer.serialize]).
     * Built by [com.intuit.playerui.core.player.ServicesConfig.toInvokableMap].
     */
    val services: Map<String, Invokable<@Contextual Any?>> = emptyMap(),
) {
    val logger: Map<String, Invokable<Unit>> = mapOf(
        "trace" to Invokable { args -> loggers.forEach { it.trace(*args) } },
        "debug" to Invokable { args -> loggers.forEach { it.debug(*args) } },
        "info" to Invokable { args -> loggers.forEach { it.info(*args) } },
        "warn" to Invokable { args -> loggers.forEach { it.warn(*args) } },
        "error" to Invokable { args -> loggers.forEach { it.error(*args) } },
    )
}
