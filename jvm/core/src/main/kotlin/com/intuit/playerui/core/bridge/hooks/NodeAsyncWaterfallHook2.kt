package com.intuit.playerui.core.bridge.hooks

import com.intuit.hooks.HookContext
import com.intuit.hooks.AsyncSeriesWaterfallHook
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable

@Serializable(NodeAsyncWaterfallHook2.Serializer::class)
public class NodeAsyncWaterfallHook2<T1, T2>(
    override val node: Node,
    private val serializer1: KSerializer<T1>,
    private val serializer2: KSerializer<T2>,
) : AsyncSeriesWaterfallHook<(HookContext, T1?, T2?) -> T1?, T1?>(), AsyncNodeHook<T1?> {

    init { init(serializer1, serializer2) }

    override suspend fun callAsync(context: HookContext, serializedArgs: Array<Any?>): T1 {
        require(serializedArgs.size == 2) { "Expected exactly two arguments, but got ${serializedArgs.size}" }
        val p1 = serializedArgs[0] as? T1
        val p2 = serializedArgs[1] as? T2
        return call(
            null,
            { f, _, _ -> f(context, p1, p2) },
            { f, _ -> f(context, p1, p2) },
        ) as T1
    }

    internal class Serializer<T1, T2>(private val serializer1: KSerializer<T1>, private val serializer2: KSerializer<T2>) : NodeWrapperSerializer<NodeAsyncWaterfallHook2<T1, T2>>({
        NodeAsyncWaterfallHook2(it, serializer1, serializer2)
    })
}