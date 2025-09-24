package com.intuit.playerui.core.bridge.hooks

import com.intuit.hooks.AsyncSeriesBailHook
import com.intuit.hooks.BailResult
import com.intuit.hooks.HookContext
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable

@OptIn(ExperimentalCoroutinesApi::class)
@Serializable(with = NodeAsyncSeriesBailHook2.Serializer::class)
public class NodeAsyncSeriesBailHook2<T1, T2, R : Any?>(
    override val node: Node,
    serializer1: KSerializer<T1>,
    serializer2: KSerializer<T2>,
) : AsyncSeriesBailHook<suspend (HookContext, T1, T2) -> BailResult<R>, R>(),
    AsyncNodeHook<R> {
    init {
        init(serializer1, serializer2)
    }

    override suspend fun callAsync(context: HookContext, serializedArgs: Array<Any?>): R {
        require(serializedArgs.size == 2) { "Expected exactly two arguments, but got ${serializedArgs.size}" }
        val (p1, p2) = serializedArgs
        return call(
            { f, _ -> f(context, p1 as T1, p2 as T2) },
            null,
        ) as R
    }

    internal class Serializer<T1, T2, R : Any>(
        private val serializer1: KSerializer<T1>,
        private val serializer2: KSerializer<T2>,
        `_`: KSerializer<R>,
    ) : NodeWrapperSerializer<NodeAsyncSeriesBailHook2<T1, T2, R>>({
            NodeAsyncSeriesBailHook2(it, serializer1, serializer2)
        })
}
