package com.intuit.player.jvm.core.bridge.hooks

import com.intuit.hooks.HookContext
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.utils.InternalPlayerApi
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.capturedKClass

/** Contains common logic for configuring a [NodeHook] to tap any JS hook */
internal interface NodeHook<R> : NodeWrapper {

    @OptIn(ExperimentalSerializationApi::class)
    fun init(vararg serializers: KSerializer<*>) {
        node.getInvokable<Unit>("tap")?.invoke(
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

@InternalPlayerApi
public inline val callingStackTraceElement: StackTraceElement get() = Thread.currentThread().stackTrace[1]
