package com.intuit.playerui.plugins.pubsub

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.runtime.Runtime

/**
 * A handle to a JavaScript TinyPubSub instance that can be shared across multiple [PubSubPlugin]
 * instances. Create one and pass it to multiple plugin constructors so they all share the same
 * event bus.
 *
 * The underlying JS instance is created the first time a [PubSubPlugin] that holds this handle
 * is applied to a runtime. [subscribe], [publish], and [unsubscribe] calls made before that
 * point will throw.
 *
 * ```kotlin
 * val sharedBus = TinyPubSub()
 * val plugin1 = PubSubPlugin(sharedPubSub = sharedBus)
 * val plugin2 = PubSubPlugin(Config("customPublish"), sharedPubSub = sharedBus)
 *
 * // After the player is set up, use the bus directly:
 * sharedBus.subscribe("myEvent") { event, data -> /* ... */ }
 * ```
 */
public class TinyPubSub {
    internal var node: Node? = null
    private var jsVarName: String? = null

    /**
     * Called by [PubSubPlugin] after the bundle has been loaded into [runtime].
     * Creates the JS TinyPubSub instance on first call; subsequent calls are no-ops and
     * return the same variable name.
     */
    internal fun getOrCreate(runtime: Runtime<*>): String =
        jsVarName ?: run {
            val varName = "_playerui_pubsub_${System.identityHashCode(this)}"
            runtime.execute("globalThis.$varName = new PubSubPlugin.TinyPubSub()")
            node = runtime.execute("globalThis.$varName") as? Node
            jsVarName = varName
            varName
        }
    }

    /**
     * Subscribe to an event
     * @param eventName The name of the event to attach a handler to
     * @param block The handler to call when the event is received
     * @return subscription token used to [unsubscribe]
     */
    public fun subscribe(eventName: String, block: (String, Any?) -> Unit): String =
        node?.getInvokable<String>("subscribe")!!(eventName, block)

    /**
     * Cancel subscription registered with [token]
     * @param token subscription token obtained from [subscribe] call
     */
    public fun unsubscribe(token: String) {
        node?.getInvokable<Any?>("unsubscribe")!!(token)
    }

    /**
     * Publish an event through this pubsub instance
     * @param eventName The name of the event
     * @param eventData Arbitrary data associated with the event
     */
    public fun publish(eventName: String, eventData: Any) {
        node?.getInvokable<Any?>("publish")!!(eventName, eventData)
    }
}
