package com.intuit.playerui.core.bridge.hooks

import com.intuit.hooks.HookContext
import com.intuit.hooks.SyncHook
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi

/**
 * Reverse-direction bridge primitive. A Kotlin-owned [com.intuit.hooks.SyncHook]
 * that surfaces to JS as `{ tap, call }`, so JS-side code can subscribe by
 * calling `.tap(name, fn)` and the Kotlin owner can fire the chain by calling
 * [fire]. Kotlin code can also tap natively via [kotlinTap].
 *
 * Mirror of [com.intuit.playerui.core.bridge.hooks.NodeHook], inverted:
 *   * [NodeHook] wraps a JS-side hook so Kotlin can subscribe to it.
 *   * [JsTappableHook] wraps a Kotlin-side hook so JS can subscribe to it.
 *
 * Variadic — args are passed through as `Array<Any?>`. SyncHook semantics
 * (no waterfall accumulation). Sufficient for notification-style hooks like
 * `onUpdate`, `onDelete`, `onSet`, `onGet`. Add waterfall/bail siblings later
 * if needed.
 */
@ExperimentalPlayerApi
public class JsTappableHook {
    private val hook = object : SyncHook<(HookContext, Array<out Any?>) -> Unit>() {
        fun tap(name: String, callback: (Array<out Any?>) -> Unit): String? =
            super.tap(name) { _, args -> callback(args) }

        fun call(args: Array<out Any?>) {
            call { f, ctx -> f(ctx, args) }
        }
    }

    /**
     * JS-facing view. Serializes as `{ tap: fn, call: fn }`. JS code does
     * `hook.tap("name", fn)`; the JS callback is registered in the underlying
     * Kotlin [hook] and fires when [fire] (or JS-side `call`) is invoked.
     */
    public val jsClassMirror: Map<String, Invokable<Any?>> = mapOf(
        "tap" to Invokable { args ->
            val name = (args.getOrNull(0) as? String) ?: "anonymous"
            val callback = args.getOrNull(1) as? Invokable<*>
                ?: error("JsTappableHook.tap: expected JS function as second arg, got ${args.getOrNull(1)}")
            hook.tap(name) { tapArgs -> callback.invoke(*tapArgs) }
            null
        },
        "call" to Invokable { args ->
            hook.call(args)
            null
        },
    )

    /** Tap natively from Kotlin. */
    public fun kotlinTap(name: String, callback: (Array<out Any?>) -> Unit) {
        hook.tap(name, callback)
    }

    /** Fire from Kotlin. Triggers every tap (from either side). */
    public fun fire(vararg args: Any?) {
        hook.call(args)
    }
}
