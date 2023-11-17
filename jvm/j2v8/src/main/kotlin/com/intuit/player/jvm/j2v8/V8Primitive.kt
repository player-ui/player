package com.intuit.player.jvm.j2v8

import com.eclipsesource.v8.V8
import com.eclipsesource.v8.V8Array
import com.eclipsesource.v8.V8Function
import com.eclipsesource.v8.V8Object
import com.eclipsesource.v8.V8Value
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.j2v8.bridge.serialization.format.J2V8Format
import com.intuit.player.jvm.j2v8.bridge.serialization.format.encodeToV8Value
import com.intuit.player.jvm.j2v8.extensions.evaluateInJSThreadBlocking

/**
 * Primitive wrapper for [V8Value]s. The intent behind this construct is to enable the
 * decoders to constrain primitive values within a wrapper to provide continuity for
 * decoded values and their common superclass, i.e. the [J2V8Format] will only ever
 * read [V8Value]s. This provides some semantic structure for serialization and limits
 * the burden on consumers for checking data types.
 */
internal open class V8Primitive internal constructor(val value: Any?) : V8Value() {
    override fun isUndefined(): Boolean = value == V8.getUndefined()

    override fun isReleased(): Boolean = false

    override fun close(): Unit = Unit

    override fun createTwin(): V8Value = this

    override fun toString(): String = value.toString()

    override fun equals(other: Any?): Boolean = if (other is V8Primitive) value == other.value else value == other

    override fun hashCode(): Int = value.hashCode()

    override fun getRuntime(): Nothing = throw UnsupportedOperationException()
}

/** Singleton instance wrapper of a null value as a [V8Primitive] */
internal object V8Null : V8Primitive(null)

// instance helpers for creating valid [V8Primitive]s
internal fun V8Primitive(content: String): V8Primitive = V8Primitive(content as Any)
internal fun V8Primitive(content: Int): V8Primitive = V8Primitive(content as Any)
internal fun V8Primitive(content: Double): V8Primitive = V8Primitive(content as Any)
internal fun V8Primitive(content: Boolean): V8Primitive = V8Primitive(content as Any)

// [V8Value] helpers for constraining to a certain subclass of [V8Value]
internal val <Context : V8Value> Context.v8Primitive: V8Primitive get() = this as? V8Primitive
    ?: throw IllegalArgumentException("Element ${this::class} is not a V8Primitive")

internal val <Context : V8Value> Context.v8Object: V8Object get() = this as? V8Object
    ?: throw IllegalArgumentException("Element ${this::class} is not a V8Object")

internal val <Context : V8Value> Context.v8Array: V8Array get() = this as? V8Array
    ?: throw IllegalArgumentException("Element ${this::class} is not a V8Array")

internal val <Context : V8Value> Context.v8Function: V8Function get() = this as? V8Function
    ?: throw IllegalArgumentException("Element ${this::class} is not a V8Function")

// [get] helpers for wrapping primitive values
internal fun V8Object.getV8Value(runtime: Runtime<V8Value>, key: String): V8Value = evaluateInJSThreadBlocking(runtime) {
    get(key).let(::V8Value)
}
internal fun V8Array.getV8Value(runtime: Runtime<V8Value>, index: Int): V8Value = evaluateInJSThreadBlocking(runtime) {
    get(index).let(::V8Value)
}

internal fun V8Value(content: Any?): V8Value = when (content) {
    is V8Value -> content
    null -> V8Null
    Unit -> V8.getUndefined()
    is String -> V8Primitive(content)
    is Int -> V8Primitive(content)
    is Double -> V8Primitive(content)
    is Long -> V8Primitive(content.toDouble())
    is Boolean -> V8Primitive(content)
    else -> throw IllegalArgumentException("content cannot be automatically represented as V8Primitive")
}

internal fun V8Array.pushPrimitive(value: V8Primitive) = push(value.value)

internal fun V8Object.addPrimitive(key: String, value: V8Primitive) = when (val value = value.value) {
    null -> addNull(key)
    is String -> add(key, value)
    is Int -> add(key, value)
    is Boolean -> add(key, value)
    is Double -> add(key, value)
    is V8Value -> add(key, value)
    else -> throw IllegalArgumentException("can only add known types to a V8Object (${value::class})")
}

internal fun <Context : V8Value> Context.V8Object(block: V8Object.() -> Unit = {}): V8Object = V8Object(runtime).apply(block)
internal fun <Context : V8Value> Context.V8Array(block: V8Array.() -> Unit = {}): V8Array = V8Array(runtime).apply(block)

/**
 * This _should_ be the main entry point for creating [V8Function]s within this module b/c it takes into account
 * runtime locking and ensuring that the return value can be appropriately handled by J2V8
 */
internal inline fun <reified T> V8Function(format: J2V8Format, crossinline block: V8Object.(args: V8Array) -> T): V8Function = format.v8.evaluateInJSThreadBlocking(format.runtime) {
    V8Function(this) { receiver, args ->
        receiver.evaluateInJSThreadBlocking(format.runtime) {
            when (val retVal = format.encodeToV8Value(block(args))) {
                is V8Primitive -> retVal.value
                else -> retVal
            }
        }
    }
}
