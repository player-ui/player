package com.intuit.playerui.core.player.services

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.hooks.JsTappableHook
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi

/**
 * Reference implementation of a fully-native DataController in Kotlin. Returned
 * by [com.intuit.playerui.core.player.DataServiceFactory], it satisfies the
 * JS-side `IDataController` shape entirely from Kotlin — no JS DataController
 * underneath.
 *
 * Scope:
 *   * Owns data as an in-memory `MutableMap<String, Any?>`.
 *   * `get` / `set` / `delete` / `serialize` are Kotlin methods exposed as
 *     `Invokable`s on the JS-facing view.
 *   * `hooks` is a JS object whose properties are [JsTappableHook.jsView]
 *     surfaces. JS code does `hooks.onUpdate.tap(...)` and the callback is
 *     registered in the Kotlin hook. Kotlin code fires those hooks via
 *     [JsTappableHook.fire] when state changes.
 *   * `onUpdate` and `onDelete` are the only hooks fired today — they're how
 *     core's `ViewController` learns to re-render. The other hook slots
 *     (`format`, `deformat`, `resolveDefaultValue`, `onSet`, `onGet`,
 *     `resolve`, `resolveDataStages`, `serialize`) are present so JS taps
 *     don't crash, but plugins relying on them won't fire when a native
 *     controller is in use. Document accordingly.
 *
 * Demonstration behavior: every `get` of a `String` value is prefixed with
 * `[kotlin-native] ` so a test can verify the Kotlin code is on the read
 * path — not the default JS DataController.
 */
@ExperimentalPlayerApi
public class KotlinDataController(
    initialData: Map<String, Any?>,
    /**
     * Optional transformation applied to every value being written. Receives
     * `(binding, value)` and returns the value to actually store. Defaults to
     * identity. Use this to demonstrate native intervention on the write path
     * (e.g. multiply, clamp, audit, encrypt) without subclassing.
     */
    private val setTransformer: (binding: String, value: Any?) -> Any? = { _, v -> v },
    /**
     * Optional transformation applied to every value being read. Receives
     * `(binding, storedValue)` and returns the value handed back to JS.
     * Defaults to identity.
     */
    private val getTransformer: (binding: String, value: Any?) -> Any? = { _, v -> v },
    /**
     * Optional JS-side `BindingParser.parse` from the ctx. Used to convert
     * string keys back into JS `BindingInstance` objects when firing
     * `onUpdate` — ViewController expects each `update.binding` to be a
     * BindingInstance, not a raw string, because it calls `.parent()` and
     * `.key()` on it downstream.
     */
    private val parseBinding: ((String) -> Any?)? = null,
) {
    private val data: MutableMap<String, Any?> = initialData.toMutableMap()

    // Hooks JS may tap. Two are actually fired from Kotlin; the rest exist so
    // setupFlow's `.tap(...)` calls don't throw on a Kotlin-owned controller.
    private val onUpdateHook = JsTappableHook()
    private val onDeleteHook = JsTappableHook()
    private val formatHook = JsTappableHook()
    private val deformatHook = JsTappableHook()
    private val resolveDefaultHook = JsTappableHook()
    private val onSetHook = JsTappableHook()
    private val onGetHook = JsTappableHook()
    private val resolveHook = JsTappableHook()
    private val resolveDataStagesHook = JsTappableHook()
    private val serializeHook = JsTappableHook()

    /**
     * The JS-facing object. Serializes into the runtime as a plain JS object
     * with method-shaped fields and a nested `hooks` object. Returned from
     * the [com.intuit.playerui.core.player.DataServiceFactory] so core/player
     * uses it in place of the default `DataController`.
     */
    public val jsView: Map<String, Any?> by lazy {
        mapOf(
            "hooks" to mapOf(
                "onUpdate" to onUpdateHook.jsView,
                "onDelete" to onDeleteHook.jsView,
                "format" to formatHook.jsView,
                "deformat" to deformatHook.jsView,
                "resolveDefaultValue" to resolveDefaultHook.jsView,
                "onSet" to onSetHook.jsView,
                "onGet" to onGetHook.jsView,
                "resolve" to resolveHook.jsView,
                "resolveDataStages" to resolveDataStagesHook.jsView,
                "serialize" to serializeHook.jsView,
            ),
            "get" to Invokable { args ->
                val binding = bindingToKey(args.getOrNull(0))
                getTransformer(binding, data[binding])
            },
            "set" to Invokable { args ->
                val transaction = args.getOrNull(0)
                val updates = applySet(transaction)
                onUpdateHook.fire(updates, args.getOrNull(1))
                updates
            },
            "delete" to Invokable { args ->
                val binding = bindingToKey(args.getOrNull(0))
                data.remove(binding)
                onDeleteHook.fire(binding)
                null
            },
            "serialize" to Invokable { _ ->
                data.toMap()
            },
            // Stubs — not exercised by the demo flow, but present so JS callers
            // don't blow up on a missing method.
            "getModel" to Invokable { _ -> data.toMap() },
            "makeReadOnly" to Invokable { _ -> jsView },
        )
    }

    private fun bindingToKey(raw: Any?): String = when (raw) {
        is String -> raw
        is Node -> {
            // BindingInstance is a JS class with an `asString()` method.
            // Bridge surfaces it as a Node; we need to call the method, not
            // read a property.
            raw.getInvokable<String?>("asString")?.invoke() ?: raw.toString()
        }
        else -> raw?.toString() ?: ""
    }

    @Suppress("UNCHECKED_CAST")
    private fun applySet(transaction: Any?): List<Map<String, Any?>> {
        val updates = mutableListOf<Map<String, Any?>>()

        fun record(rawBinding: Any?, value: Any?) {
            val key = bindingToKey(rawBinding)
            val transformed = setTransformer(key, value)
            val old = data[key]
            data[key] = transformed
            // ViewController calls `.parent()` / `.key()` on each update's
            // binding, so we hand back a JS BindingInstance when possible.
            val bindingForHook = if (rawBinding is Node) rawBinding else parseBinding?.invoke(key) ?: key
            updates += mapOf("binding" to bindingForHook, "oldValue" to old, "newValue" to transformed)
        }

        when (transaction) {
            is Map<*, *> -> transaction.forEach { (k, v) -> record(k, v) }
            is List<*> -> transaction.forEach { entry ->
                val pair = entry as? List<Any?> ?: return@forEach
                record(pair.getOrNull(0), pair.getOrNull(1))
            }
        }
        return updates
    }
}
