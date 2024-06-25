package com.intuit.playerui.hermes.extensions

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.hermes.bridge.HermesNode
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntimeFormat
import com.intuit.playerui.jsi.Array
import com.intuit.playerui.jsi.Function
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Value
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.builtins.ArraySerializer

internal fun Any?.handleValue(format: HermesRuntimeFormat): Any? = when (this) {
    is Value -> transform(format)
    else -> this
}

internal fun Value.transform(format: HermesRuntimeFormat): Any? = when {
    isUndefined() -> null
    isNull() -> null
    isBoolean() -> asBoolean()
    isNumber() -> asNumber()
    isString() -> asString(format.runtime)
    isBigInt() -> asBigInt(format.runtime)
    isSymbol() -> asSymbol(format.runtime).toString(format.runtime) // TODO: This is what we do w/ symbols?
    isObject() -> asObject(format.runtime).transform(format)
    else -> null
}

internal fun Object.transform(format: HermesRuntimeFormat): Any = when {
    isArray(format.runtime) -> asArray(format.runtime).toList(format)
    isFunction(format.runtime) -> asFunction(format.runtime).toInvokable<Any?>(format, format.serializer())
    else ->  toNode(format)
}

// Object can be an Array or Function here, prefer using transform, unless you specifically need a Node
internal fun Object.toNode(format: HermesRuntimeFormat): Node = HermesNode(this, format.runtime).let {
    // Auto wrapping as asset if it meets the criteria - it's still a node, but a special one
    if (false && it.containsKey("id") && it.containsKey("value")) Asset(it) else it
}

internal fun Array.toList(format: HermesRuntimeFormat): List<Any?> = (0..size(format.runtime))
    .map { i -> getValueAtIndex(format.runtime, i) }
    .map { it.transform(format) }

internal fun <R> Function.toInvokable(format: HermesRuntimeFormat, deserializationStrategy: DeserializationStrategy<R>?): Invokable<R> = Invokable { args ->
    try {
        // TODO: Instead of handling the value, and then deserializing, could we just deserialize since we know the result will be a Value?
        val result = call(format.runtime, format.encodeToRuntimeValue(
            ArraySerializer(GenericSerializer()),
            args as kotlin.Array<Any?>, // TODO: Anything we can do about this cast?
        )).handleValue(format)

        if (result is Node && deserializationStrategy != null) {
            result.deserialize(deserializationStrategy)
        } else result as R
    } catch (e: Throwable) {
        e.printStackTrace()
        throw e
    }
}
