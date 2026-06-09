package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi

/**
 * Factory invoked by JS core when it needs to construct the data controller
 * for a flow. The Kotlin implementation returns *any* value whose shape
 * satisfies the JS-side `IDataController` interface — typically a
 * `Map<String, Any?>` like
 * [com.intuit.playerui.core.player.services.KotlinDataController.jsClassMirror]
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
    internal fun toInvokableMap(): Map<String, Invokable<Any?>> = buildMap {
        if (data != null) {
            // The factory returns the controller (typically a Map<String, Any?>
            // mirroring IDataController), so the Invokable's return type is Any?.
            // Only the encode path runs (Kotlin -> JS), which serializes the
            // function itself and ignores the return-type serializer.
            put(
                "data",
                Invokable { args ->
                    val ctx = args.getOrNull(0) as? Node
                        ?: error("services.data factory: expected a Node ctx as the first argument from core")
                    data.create(ctx)
                },
            )
        }
    }
}
