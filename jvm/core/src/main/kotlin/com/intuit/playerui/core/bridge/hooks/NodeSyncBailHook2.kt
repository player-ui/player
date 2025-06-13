package com.intuit.playerui.core.bridge.hooks

import com.intuit.hooks.BailResult
import com.intuit.hooks.HookContext
import com.intuit.hooks.SyncBailHook
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable

@Serializable(with = NodeSyncBailHook2.Serializer::class)
public class NodeSyncBailHook2<T1, T2, R>(
    override val node: Node,
    private val serializer1: KSerializer<T1>,
    private val serializer2: KSerializer<T2>,
) : SyncBailHook<(HookContext, T1, T2) -> BailResult<R>, R>(), NodeHook<R?> {

    init { init(serializer1, serializer2) }

    override fun call(context: HookContext, serializedArgs: Array<Any?>): R? {
        require(serializedArgs.size == 2)
        val (p1, p2) = serializedArgs
        return call(
            { f, t -> f(context, p1 as T1, p2 as T2) },
        ) { Unit as R }
    }

    public fun tap(name: String, callback: (T1?, T2?) -> BailResult<R>): String? = super.tap(name) { _, p1, p2 -> callback(p1, p2) }

    public inline fun tap(noinline callback: (T1?, T2?) -> BailResult<R>): String? = tap(callingStackTraceElement.toString(), callback)

    public inline fun tap(noinline callback: (HookContext, T1?, T2?) -> BailResult<R>): String? = tap(callingStackTraceElement.toString(), callback)

    internal class Serializer<T1, T2, R>(private val serializer1: KSerializer<T1>, private val serializer2: KSerializer<T2>, private val
    `_`: KSerializer<R>) : NodeWrapperSerializer<NodeSyncBailHook2<T1, T2, R>>({
        NodeSyncBailHook2(it, serializer1, serializer2)
    })
}
