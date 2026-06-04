package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi

/**
 * Factory invoked by JS core when it needs to construct the data controller
 * for a flow. The Kotlin implementation returns *any* value whose shape
 * satisfies the JS-side `IDataController` interface — typically a
 * `Map<String, Any?>` like
 * [com.intuit.playerui.core.player.services.KotlinDataController.jsView]
 * — and core will use it as the data controller. Returning `null` falls
 * through to the default JS `DataController`.
 *
 * The [ctx] is the same context the default JS constructor would receive:
 * `data`, `pathResolver`, `middleware`, `logger`. Reach into it via the
 * `Node` accessors.
 */
@ExperimentalPlayerApi
public fun interface DataServiceFactory {
    public fun create(ctx: Node): Any?
}

/**
 * Bag of optional Kotlin-side service factories that replace built-in
 * Player services. Construct one and pass to [HeadlessPlayer] to override
 * the default service implementations from native code.
 *
 * Internally converts each Kotlin factory to a JS-callable [Invokable] so
 * core/player can invoke `services.data(ctx)` and receive the Kotlin
 * lambda's return value.
 */
@ExperimentalPlayerApi
public data class ServicesConfig(
    val data: DataServiceFactory? = null,
) {
    internal fun toInvokableMap(): Map<String, Invokable<String?>> = buildMap {
        if (data != null) {
            // Return type is structurally Any?; the declared Invokable<String?>
            // is purely for serialization machinery. JS sees whatever the
            // factory returned (typically a Map<String, Any?> matching
            // IDataController). The unchecked cast is safe because the
            // return-type serializer is never invoked on the encode path.
            @Suppress("UNCHECKED_CAST")
            put(
                "data",
                Invokable<Any?> { args ->
                    val ctx = args.getOrNull(0) as? Node
                        ?: error("services.data factory: expected a Node ctx as the first argument from core")
                    data.create(ctx)
                } as Invokable<String?>,
            )
        }
    }
}
