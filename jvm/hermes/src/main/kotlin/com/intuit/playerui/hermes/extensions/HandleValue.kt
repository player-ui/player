package com.intuit.playerui.hermes.extensions

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.serialization.format.encodeToRuntimeValue
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.hermes.bridge.HermesNode
import com.intuit.playerui.hermes.bridge.runtime.PlayerRuntimeException
import com.intuit.playerui.jsi.Array
import com.intuit.playerui.jsi.Function
import com.intuit.playerui.jsi.Object
import com.intuit.playerui.jsi.Runtime
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.serialization.format.JSIFormat
import kotlinx.serialization.DeserializationStrategy

// These APIs require RuntimeThreadContext to ensure the consumer uses them within the context of the dedicated runtime
// thread, rather than these methods trying to figure out when they should defer to evaluateInJSThread, which should
// help prevent inefficiencies trying to, possibly redundantly, defer to the runtime thread when the APIs require.

context(RuntimeThreadContext) internal fun Any?.handleValue(format: JSIFormat): Any? = when (this) {
    is Value -> transform(format)
    else -> this
}

context(RuntimeThreadContext) private fun Value.transform(format: JSIFormat): Any? = when {
    isUndefined() -> null
    isNull() -> null
    isBoolean() -> asBoolean()
    isNumber() -> asNumber().let { double ->
        // this is currently done to work well with existing Player runtime integration, but should go away when JSI convergence happens
        if (double % 1 == 0.0) double.toInt() else double
    }
    isString() -> asString(format.runtime)
    isBigInt() -> asBigInt(format.runtime)
    isSymbol() -> asSymbol(format.runtime).toString(format.runtime)
    isObject() -> asObject(format.runtime).transform(format)
    else -> null
}

context(RuntimeThreadContext) internal fun Object.transform(format: JSIFormat): Any = format.runtime.evaluateInJSThreadBlocking {
    when {
        isArray(format.runtime) -> asArray(format.runtime).toList(format)
        isFunction(format.runtime) -> asFunction(format.runtime).toInvokable<Any?>(format, this@transform, format.serializer())
        else -> toNode(format)
    }
}

context(RuntimeThreadContext) internal fun Object.filteredKeys(runtime: Runtime): Set<String> {
    val names = getPropertyNames(runtime)
    val size = names.size(runtime)

    return (0 until size).map { i -> names.getValueAtIndex(runtime, i) }
        // NOTE: since we don't have proper propname support, we just toString it - this may not be suitable for all use cases
        .map { it.toString(runtime) }
        .filter { !getProperty(runtime, it).isUndefined() }
        .toSet()
}

// Object can be an Array or Function here, prefer using transform, unless you specifically need a Node
internal fun Object.toNode(format: JSIFormat): Node = HermesNode(this, format.runtime).let {
    // Auto wrapping as asset if it meets the criteria - it's still a node, but a special one
    if (it.containsKey("id") && it.containsKey("type")) Asset(it) else it
}

context(RuntimeThreadContext) internal fun Array.toList(format: JSIFormat): List<Any?> = (0 until size(format.runtime))
    .map { i -> getValueAtIndex(format.runtime, i) }
    .map { it.transform(format) }

internal fun <R> Function.toInvokable(format: JSIFormat, thisVal: Object, deserializationStrategy: DeserializationStrategy<R>?): Invokable<R> = Invokable { args ->
    format.runtime.evaluateInJSThreadBlocking {
        try {
            val encodedArgs = args.map { format.encodeToRuntimeValue(it) }.toTypedArray()
            val result = callWithThis(format.runtime, thisVal, *encodedArgs)

            // TODO: Unsafe cast really, so we might want to require a deserialization strategy
            if (deserializationStrategy != null) {
                format.decodeFromRuntimeValue(deserializationStrategy, result)
            } else {
                result.handleValue(format) as R
            }
        } catch (e: Throwable) {
            e.printStackTrace()
            throw PlayerRuntimeException(format.runtime, "Error invoking JS function (${asValue(format.runtime).toString(format.runtime)}) with args (${args.joinToString(",")})", e)
        }
    }
}
