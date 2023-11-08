package com.intuit.player.jvm.core.bridge.hooks
import com.intuit.hooks.HookContext
import com.intuit.hooks.SyncHook
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable

public abstract class SyncHook1<T1> : SyncHook<(HookContext, T1) -> Unit>() {
    public fun tap(name: String, callback: (T1) -> Unit): String? = super.tap(name) { _, p1 -> callback(p1) }
    public inline fun tap(noinline callback: (T1) -> Unit): String? = tap(callingStackTraceElement.toString(), callback)
    public inline fun tap(noinline callback: (HookContext, T1) -> Unit): String? = tap(callingStackTraceElement.toString(), callback)
}

@Serializable(with = NodeSyncHook1.Serializer::class)
public class NodeSyncHook1<T1>(override val node: Node, private val serializer1: KSerializer<T1>) : SyncHook1<T1?>(), NodeHook<Unit> {

    init { init(serializer1) }
    override fun call(context: HookContext, serializedArgs: Array<Any?>) {
        require(serializedArgs.size == 1)
        val (p1) = serializedArgs
        call { f, _ -> f(context, p1 as? T1) }
    }

    internal class Serializer<T1>(private val serializer1: KSerializer<T1>) : NodeWrapperSerializer<NodeSyncHook1<T1>>({
        NodeSyncHook1(it, serializer1)
    })
}

@Serializable(with = NodeSyncHook2.Serializer::class)
public class NodeSyncHook2<T1, T2>(override val node: Node, private val serializer1: KSerializer<T1>, private val serializer2: KSerializer<T2>) : SyncHook<(HookContext, T1?, T2?) -> Unit>(), NodeHook<Unit> {

    init { init(serializer1, serializer2) }
    override fun call(context: HookContext, serializedArgs: Array<Any?>) {
        require(serializedArgs.size == 2)
        val (p1, p2) = serializedArgs
        call { f, _ ->
            f(
                context,
                p1 as? T1,
                p2 as? T2,
            )
        }
    }
    public fun tap(name: String, callback: (T1?, T2?) -> Unit): String? = super.tap(name) { _, p1, p2 -> callback(p1, p2) }
    public inline fun tap(noinline callback: (T1?, T2?) -> Unit): String? = tap(callingStackTraceElement.toString(), callback)

    public inline fun tap(noinline callback: (HookContext, T1?, T2?) -> Unit): String? = tap(callingStackTraceElement.toString(), callback)

    internal class Serializer<T1, T2>(private val serializer1: KSerializer<T1>, private val serializer2: KSerializer<T2>) : NodeWrapperSerializer<NodeSyncHook2<T1, T2>>({
        NodeSyncHook2(it, serializer1, serializer2)
    })
}
