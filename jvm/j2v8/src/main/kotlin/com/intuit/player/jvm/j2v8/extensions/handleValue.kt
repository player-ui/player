package com.intuit.player.jvm.j2v8.extensions

import com.eclipsesource.v8.V8
import com.eclipsesource.v8.V8Array
import com.eclipsesource.v8.V8Function
import com.eclipsesource.v8.V8Object
import com.eclipsesource.v8.V8Value
import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeFormat
import com.intuit.player.jvm.core.bridge.serialization.format.serializer
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.j2v8.V8Primitive
import com.intuit.player.jvm.j2v8.bridge.V8Node
import com.intuit.player.jvm.j2v8.v8Array
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.builtins.ArraySerializer

internal fun Any?.handleValue(format: RuntimeFormat<V8Value>): Any? = when (this) {
    is V8Primitive -> value
    is V8Value -> transform(format)
    else -> this
}

private fun V8Value.transform(format: RuntimeFormat<V8Value>): Any? = lockIfDefined {
    when (this) {
        V8.getUndefined() -> null
        is V8Primitive -> value
        is V8Function -> toInvokable<Any?>(format, this, format.serializer())
        is V8Array -> toList(format)
        is V8Object -> toNode(format)
        else -> null
    }
}

internal fun V8Array.toList(format: RuntimeFormat<V8Value>): List<Any?>? = if (isUndefined) null else lockIfDefined {
    keys.map(::get).map { it.handleValue(format) }
}

internal fun V8Object.toNode(format: RuntimeFormat<V8Value>): Node? = if (isUndefined) null else lockIfDefined {
    if (contains("id") && contains("type"))
        Asset(V8Node(this, format.runtime))
    else V8Node(this, format.runtime)
}

internal fun <R> V8Function.toInvokable(format: RuntimeFormat<V8Value>, receiver: V8Object, deserializationStrategy: DeserializationStrategy<R>?): Invokable<R>? = if (isUndefined) null else lockIfDefined {
    Invokable { args ->
        blockingLock {
            try {
                when (
                    val result =
                        call(
                            receiver,
                            format.encodeToRuntimeValue(
                                ArraySerializer(GenericSerializer()),
                                args as Array<Any?>
                            ).v8Array
                        ).handleValue(format)
                ) {
                    is Node -> deserializationStrategy?.let {
                        result.deserialize(deserializationStrategy)
                    } ?: run {
                        result as R
                    }
                    else -> result as R
                }
            } catch (e: Throwable) {
                e.printStackTrace()
                throw e
            }
        }
    }
}
