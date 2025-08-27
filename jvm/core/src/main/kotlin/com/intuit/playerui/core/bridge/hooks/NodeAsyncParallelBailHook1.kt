package com.intuit.playerui.core.bridge.hooks

import com.intuit.hooks.AsyncParallelBailHook
import com.intuit.hooks.BailResult
import com.intuit.hooks.HookContext
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable

@OptIn(ExperimentalCoroutinesApi::class)
@Serializable(with = NodeAsyncParallelBailHook1.Serializer::class)
public class NodeAsyncParallelBailHook1<T1, R : Any>(
    override val node: Node,
    serializer1: KSerializer<T1>,
) : AsyncParallelBailHook<(HookContext, T1) -> BailResult<R>, R>(),
    AsyncNodeHook<R> {
    init {
        init(serializer1)
    }

    override suspend fun callAsync(context: HookContext, serializedArgs: Array<Any?>): R {
        require(serializedArgs.size == 1) { "Expected exactly one argument, but got ${serializedArgs.size}" }
        val (p1) = serializedArgs
        val result = call(10) { f, _ ->
            f(context, p1 as T1)
        } as R
        return result
    }

    /** The return type serializer is never used, but in order to generate the serializer with @Serializable for [NodeAsyncParallelBailHook1], it's needed */
    internal class Serializer<T1, R : Any>(
        private val serializer1: KSerializer<T1>,
        `_`: KSerializer<R>,
    ) : NodeWrapperSerializer<NodeAsyncParallelBailHook1<T1, R>>({
            NodeAsyncParallelBailHook1(it, serializer1)
        })
}
