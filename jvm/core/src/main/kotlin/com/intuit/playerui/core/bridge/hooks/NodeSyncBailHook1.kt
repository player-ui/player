package com.intuit.playerui.core.bridge.hooks

import com.intuit.hooks.BailResult
import com.intuit.hooks.HookContext
import com.intuit.hooks.SyncBailHook
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable

@Serializable(with = NodeSyncBailHook1.Serializer::class)
public class NodeSyncBailHook1<T, R>(
    override val node: Node,
    private val serializer1: KSerializer<T>,
) : SyncBailHook<(HookContext, T) -> BailResult<R>, R>(), NodeHook<R?> {

    init { init(serializer1) }

    override fun call(context: HookContext, serializedArgs: Array<Any?>): R? {
        require(serializedArgs.size == 1)
        val p1 = serializedArgs[0] as T
        return call(
            { f, t -> f(context, p1) },
        ) { Unit as R }
    }

    public fun tap(name: String, callback: (T?) -> BailResult<R>): String? = super.tap(name) { _, p1 -> callback(p1) }

    public inline fun tap(noinline callback: (T?) -> BailResult<R>): String? = tap(callingStackTraceElement.toString(), callback)

    public inline fun tap(noinline callback: (HookContext, T?) -> BailResult<R>): String? = tap(callingStackTraceElement.toString(), callback)

    internal class Serializer<T, R>(private val serializer1: KSerializer<T>, private val serializer2: KSerializer<R>) : NodeWrapperSerializer<NodeSyncBailHook1<T, R>>({
        NodeSyncBailHook1(it, serializer1)
    })
}

@Serializable(with = NodeSyncBailHook.Serializer::class)
public class NodeSyncBailHook<R>(
    override val node: Node,
) : SyncBailHook<(HookContext) -> BailResult<R>, R>(), NodeHook<R?> {

    override fun call(context: HookContext, serializedArgs: Array<Any?>): R? {
        require(serializedArgs.isEmpty())
        return call(
            { f, _ -> f(context) },
        ) { Unit as R }
    }

    public fun tap(name: String, callback: () -> BailResult<R>): String? = super.tap(name) { _ -> callback() }

    public inline fun tap(noinline callback: () -> BailResult<R>): String? = tap(callingStackTraceElement.toString(), callback)

    public inline fun tap(noinline callback: (HookContext) -> BailResult<R>): String? = tap(callingStackTraceElement.toString(), callback)

    internal class Serializer<R> : NodeWrapperSerializer<NodeSyncBailHook<R>>({
        NodeSyncBailHook(it)
    })
}