package com.intuit.player.jvm.core.bridge.hooks

import com.intuit.hooks.HookContext
import com.intuit.hooks.SyncWaterfallHook
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable

/**
 * A note of caution when using these hooks. Waterfall hooks act as accumulators, applying the tapped functions
 * in series on a value. If the value itself was mutated, this would mean that trying to persist the value outside
 * the scope of the tapped function would result in an up-to-date representation of the final accumulated value.
 * However, with the immutable principles implemented by the core player runtime, this means that any mutated value
 * is meant to be a completely new object. Persisting an early value would result in an object that is potentially
 * _not_ the final accumulated value, meaning it might not even be relevant anymore. In some circumstances, this
 * value might be garbage collected and result in a [PlayerRuntimeException][com.intuit.player.jvm.core.bridge.PlayerRuntimeException]
 * representing that the underlying JS instance has been released. If there is a use case to persist this value
 * outside of the tapped function, this can be done by reading the information and storing it in a non-Node backed
 * object from within the tapped function.
 */
@Serializable(NodeSyncWaterfallHook1.Serializer::class)
public class NodeSyncWaterfallHook1<T1>(override val node: Node, private val serializer1: KSerializer<T1>) : SyncWaterfallHook<(HookContext, T1?) -> T1?, T1?>(), NodeHook<T1?> {

    init { init(serializer1) }

    override fun call(context: HookContext, serializedArgs: Array<Any?>): T1? {
        require(serializedArgs.size == 1)
        val p1 = serializedArgs[0] as? T1
        return call(
            null,
            { f, _, _ -> f(context, p1) },
            { f, _ -> f(context, p1) },
        )
    }

    public fun tap(name: String, callback: (T1?) -> T1?): String? = super.tap(name) { _, p1 -> callback(p1) }

    public inline fun tap(noinline callback: (T1?) -> T1?): String? = tap(callingStackTraceElement.toString(), callback)

    public inline fun tap(noinline callback: (HookContext, T1?) -> T1?): String? = tap(callingStackTraceElement.toString(), callback)

    internal class Serializer<T1>(private val serializer1: KSerializer<T1>) : NodeWrapperSerializer<NodeSyncWaterfallHook1<T1>>({
        NodeSyncWaterfallHook1(it, serializer1)
    })
}

@Serializable(NodeSyncWaterfallHook2.Serializer::class)
public class NodeSyncWaterfallHook2<T1, T2>(
    override val node: Node,
    private val serializer1: KSerializer<T1>,
    private val serializer2: KSerializer<T2>,
) : SyncWaterfallHook<(HookContext, T1?, T2?) -> T1?, T1?>(), NodeHook<T1?> {

    init { init(serializer1, serializer2) }

    override fun call(context: HookContext, serializedArgs: Array<Any?>): T1? {
        require(serializedArgs.size == 2)
        val p1 = serializedArgs[0] as? T1
        val p2 = serializedArgs[1] as? T2
        return call(
            null,
            { f, _, _ -> f(context, p1, p2) },
            { f, _ -> f(context, p1, p2) },
        )
    }

    public fun tap(name: String, callback: (T1?, T2?) -> T1?): String? = super.tap(name) { _, p1, p2 -> callback(p1, p2) }

    public inline fun tap(noinline callback: (T1?, T2?) -> T1?): String? = tap(callingStackTraceElement.toString(), callback)

    public inline fun tap(noinline callback: (HookContext, T1?, T2?) -> T1?): String? = tap(callingStackTraceElement.toString(), callback)

    internal class Serializer<T1, T2>(private val serializer1: KSerializer<T1>, private val serializer2: KSerializer<T2>) : NodeWrapperSerializer<NodeSyncWaterfallHook2<T1, T2>>({
        NodeSyncWaterfallHook2(it, serializer1, serializer2)
    })
}
