package com.intuit.playerui.graaljs.extensions

import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.serialization.format.RuntimeFormat
import com.intuit.playerui.core.bridge.serialization.format.encodeToRuntimeValue
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.graaljs.bridge.GraalNode
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import org.graalvm.polyglot.Value

internal fun Any?.handleValue(format: RuntimeFormat<Value>): Any? = when (this) {
    is Value -> transform(format)
    else -> this
}

private fun Value.transform(format: RuntimeFormat<Value>): Any? = when {
    isNull -> null
    isHostObject -> when (val hostObject = asHostObject<Any>()) {
        is Unit -> null
        is JsonElement -> Json.decodeFromJsonElement(GenericSerializer(), hostObject)
        else -> hostObject
    }
    hasArrayElements() -> toList(format)
    canExecute() -> toInvokable<Any>(format, format.serializer())
    metaObject.toString() == "symbol" -> null // this is also awful, but consistent w/ j2v8
    else -> when (this.`as`(Any::class.java)) {
        is Int -> asInt()
        is Double, is Long -> try { asInt() } catch (e: Exception) { asDouble() }
        is String -> asString()
        is Boolean -> asBoolean()
        /*
        * this is kind of awful, Graal's execute returns the result slightly differently
        * from J2V8, so if a node is the return result of an execution, the Value passed here
        * will have all the map methods instead of the actual map
        * Refer to the tests in NodeSerializationTest
        * */
        is Map<*, *> -> if (canInvokeMember("getGraalObject")) invokeMember("getGraalObject").toNode(format) else toNode(format)
        else -> throw SerializationException("Value ($this) of type (${this::class.java}) is unknown")
    }
}

internal fun Value.toList(format: RuntimeFormat<Value>): List<Any?>? = if (isNull || !hasArrayElements()) {
    null
} else {
    lockIfDefined {
        (0 until this.arraySize).map(::getArrayElement).map { it.handleValue(format) }
    }
}

internal fun Value.toNode(format: RuntimeFormat<Value>): Node? = if (isNull || !hasMembers()) {
    null
} else {
    lockIfDefined {
        if (this.hasMember("id") && this.hasMember("type")) {
            Asset(GraalNode(this, format.runtime))
        } else {
            GraalNode(this, format.runtime)
        }
    }
}

internal fun <R> Value.toInvokable(format: RuntimeFormat<Value>, deserializationStrategy: DeserializationStrategy<R>?): Invokable<R>? = if (isNull || !canExecute()) {
    null
} else {
    lockIfDefined {
        Invokable { args ->
            blockingLock {
                when (
                    val result =
                        this.execute(
                            *format.encodeToRuntimeValue(
                                args as Array<Any?>,
                            ).`as`(List::class.java).toTypedArray(),
                        ).handleValue(format)
                ) {
                    is Node -> deserializationStrategy?.let {
                        result.deserialize(deserializationStrategy)
                    } ?: run {
                        result as R
                    }
                    else -> result as R
                }
            }
        }
    }
}
