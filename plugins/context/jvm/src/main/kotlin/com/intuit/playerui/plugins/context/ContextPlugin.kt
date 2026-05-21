package com.intuit.playerui.plugins.context

import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.findPlugin

/**
 * JVM wrapper around the JS ContextPlugin. Exposes a name-based API so native
 * consumers can read, write, and observe context entries without constructing
 * JS symbol-backed keys on the bridge.
 */
public class ContextPlugin : JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH) {
    /**
     * Store [value] under the context entry identified by [name], registering
     * a human-readable [description] for introspection consumers.
     */
    public fun set(
        name: String,
        description: String,
        value: Any?,
    ) {
        instance.getInvokable<Any?>("setByName")!!(name, description, value)
    }

    /** Read the current value for the entry identified by [name], or null if unset. */
    public fun get(name: String): Any? = instance
        .getInvokable<Any?>("getByName")!!(name)

    /** Returns true if the entry identified by [name] has a value or transform. */
    public fun has(name: String): Boolean = instance
        .getInvokable<Boolean>("hasByName")!!(name)

    /**
     * Subscribe to updates for the entry identified by [name]. The [block] is
     * invoked with the new value and the [name] whenever the entry changes.
     * Returns a token usable with [unsubscribe].
     */
    public fun subscribe(
        name: String,
        description: String,
        block: (Any?, String) -> Unit,
    ): String = instance
        .getInvokable<String>("subscribeByName")!!(name, description, block)

    /**
     * Subscribe to every context update. The [block] is invoked with the new
     * value, the resolved key name (or null for non-namespaced keys), and the
     * key's description.
     */
    public fun subscribeAll(block: (Any?, String?, String) -> Unit): String = instance
        .getInvokable<String>("subscribeAllByName")!!(block)

    /** Cancel the subscription registered with [token]. */
    public fun unsubscribe(token: String) {
        instance.getInvokable<Any?>("unsubscribe")!!(token)
    }

    /** Returns a list of registered entry descriptors (symbol, description, flags). */
    public fun list(): Any? = instance.getInvokable<Any?>("list")!!()

    /** Returns the stack of frozen snapshots from prior flows. */
    public fun history(): Any? = instance.getInvokable<Any?>("history")!!()

    private companion object {
        private const val PLUGIN_NAME = "ContextPlugin.ContextPlugin"
        private const val BUNDLED_SOURCE_PATH = "plugins/context/core/dist/ContextPlugin.native.js"
    }
}

/** Convenience getter to find the first [ContextPlugin] registered to the [Player]. */
public val Player.contextPlugin: ContextPlugin? get() = findPlugin()
