package com.intuit.playerui.plugins.context

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.deserialize
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.findPlugin

/**
 * JVM wrapper around the JS ContextPlugin. Exposes a name-based API so native
 * consumers can read, write, and observe context entries.
 *
 * Reads are typed: `get<SomeContext>("name")` deserializes the entry into a
 * Kotlin object, including any function-typed members, so a caller does
 * `get<SomeContext>("name").someFunction(arg1, arg2)` with full type safety.
 */
@OptIn(ExperimentalPlayerApi::class)
public class ContextPlugin :
    JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH),
    NodeWrapper {
    override val node: Node get() = instance

    private val setByName: (String, String, Any?) -> Unit by NodeSerializableFunction()

    /** Exposed for the inline reified [get]; not part of the public surface. */
    @PublishedApi
    internal val getByName: (String) -> Any? by NodeSerializableFunction()
    private val hasByName: (String) -> Boolean by NodeSerializableFunction()
    private val subscribeByName: (String, String, (Any?, String) -> Unit) -> String by NodeSerializableFunction()
    private val subscribeAllByName: ((Any?, String?, String) -> Unit) -> String by NodeSerializableFunction()
    private val unsubscribe: (String) -> Unit by NodeSerializableFunction()
    private val list: () -> List<Node> by NodeSerializableFunction()
    private val history: () -> List<Node> by NodeSerializableFunction()

    /**
     * Store [value] under the context entry identified by [name], registering
     * a human-readable [description] for introspection consumers.
     */
    public fun set(
        name: String,
        description: String,
        value: Any?,
    ) {
        setByName(name, description, value)
    }

    /**
     * Read the entry identified by [name], deserialized into [T], or null if
     * unset. [T] may be a primitive or any `@Serializable` type, including one
     * with function-typed members that arrive as callable Kotlin functions:
     *
     * ```
     * plugin.get<PlayerStateContext>("player.state")?.flow?.transition?.invoke("Next")
     * ```
     */
    public inline fun <reified T> get(name: String): T? = when (val value = getByName(name)) {
        null -> null
        is Node -> value.deserialize<T>()
        else -> value as T
    }

    /** Returns true if the entry identified by [name] has a value or transform. */
    public fun has(name: String): Boolean = hasByName(name)

    /**
     * Subscribe to updates for the entry identified by [name]. The [block] is
     * invoked with the new value and the [name] whenever the entry changes.
     * Returns a token usable with [unsubscribe].
     */
    public fun subscribe(
        name: String,
        description: String,
        block: (Any?, String) -> Unit,
    ): String = subscribeByName(name, description, block)

    /**
     * Subscribe to every context update. The [block] is invoked with the new
     * value, the resolved key name (or null for non-namespaced keys), and the
     * key's description.
     */
    public fun subscribeAll(block: (Any?, String?, String) -> Unit): String = subscribeAllByName(block)

    /** Cancel the subscription registered with [token]. */
    public fun unsubscribe(token: String) {
        unsubscribe.invoke(token)
    }

    /** Returns the registered entry descriptors (description + value/transform flags). */
    public fun list(): List<ContextEntryDescriptor> = list.invoke().map { it.deserialize() }

    /** Returns the stack of frozen snapshots from prior flows. */
    public fun history(): List<FrozenContextSnapshot> = history.invoke().map { it.deserialize() }

    private companion object {
        private const val PLUGIN_NAME = "ContextPlugin.ContextPlugin"
        private const val BUNDLED_SOURCE_PATH = "plugins/context/core/dist/ContextPlugin.native.js"
    }
}

/** Convenience getter to find the first [ContextPlugin] registered to the [Player]. */
public val Player.contextPlugin: ContextPlugin? get() = findPlugin()
