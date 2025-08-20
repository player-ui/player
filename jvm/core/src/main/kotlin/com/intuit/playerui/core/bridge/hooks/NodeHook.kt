package com.intuit.playerui.core.bridge.hooks

import com.intuit.hooks.HookContext
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.Promise
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.utils.InternalPlayerApi
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.capturedKClass

/** Contains common logic for configuring a [NodeHook] to tap any JS hook */
internal interface NodeHook<R> : NodeWrapper {
    @OptIn(ExperimentalSerializationApi::class)
    fun init(vararg serializers: KSerializer<*>) {
        node.getInvokable<Any?>("tap")?.invoke(
            mapOf("name" to "name", "context" to true),
            Invokable { args ->
                val context = args[0] as Map<String, Any>
                val rest = args.drop(1).zip(serializers).map { (value, serializer) ->
                    if (serializer.descriptor.isNullable && value == null) {
                        value
                    } else if (value!!::class == serializer.descriptor.capturedKClass) {
                        value
                    } else if (value is Node) {
                        value.deserialize(serializer)
                    } else {
                        value
                    }
                }
                call(HashMap(context), rest.toTypedArray())
            },
        )
    }

    fun call(context: HookContext, serializedArgs: Array<Any?>): R
}

internal interface AsyncNodeHook<R : Any?> : NodeHook<Promise> {
    override fun call(context: HookContext, serializedArgs: Array<Any?>): Promise = node.runtime.Promise { resolve, reject ->
        val result = callAsync(context, serializedArgs)
        resolve(result)
    }

    suspend fun callAsync(context: HookContext, serializedArgs: Array<Any?>): R
}

@InternalPlayerApi
public inline val callingStackTraceElement: StackTraceElement get() = Thread.currentThread().stackTrace[1]
