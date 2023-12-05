package com.intuit.player.jvm.j2v8.bridge

import com.eclipsesource.v8.V8
import com.eclipsesource.v8.V8Array
import com.eclipsesource.v8.V8Function
import com.eclipsesource.v8.V8Object
import com.eclipsesource.v8.V8Value
import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeFormat
import com.intuit.player.jvm.j2v8.extensions.evaluateInJSThreadBlocking
import com.intuit.player.jvm.j2v8.extensions.evaluateInJSThreadIfDefinedBlocking
import com.intuit.player.jvm.j2v8.extensions.handleValue
import com.intuit.player.jvm.j2v8.extensions.mapUndefinedToNull
import com.intuit.player.jvm.j2v8.extensions.toInvokable
import com.intuit.player.jvm.j2v8.extensions.toList
import com.intuit.player.jvm.j2v8.extensions.toNode
import com.intuit.player.jvm.j2v8.getV8Value
import kotlinx.serialization.DeserializationStrategy

/** Pseudo constructor to create a [Node] from a [V8Object] */
public fun Runtime<V8Value>.Node(obj: V8Object): Node = V8Node(obj, this)

internal class V8Node(override val v8Object: V8Object, override val runtime: Runtime<V8Value>) : Node, V8ObjectWrapper {

    override val format: RuntimeFormat<V8Value> get() = runtime.format

    override val keys: Set<String> by lazy {
        v8Object.evaluateInJSThreadIfDefinedBlocking(runtime) {
            keys.filter { v8Object.get(it) != V8.getUndefined() }.toSet()
        } ?: emptySet()
    }

    override val size: Int by lazy {
        keys.size
    }

    override val entries: Set<Map.Entry<String, Any?>> by lazy {
        keys.associateWith { get(it) }.entries
    }

    override val values: List<Any?> by lazy {
        keys.map(::get)
    }

    override fun containsKey(key: String): Boolean = keys.contains(key)

    override fun containsValue(value: Any?): Boolean = values.contains(value)

    override fun isEmpty(): Boolean = size == 0

    // Getter APIs
    override operator fun get(key: String): Any? = v8Object.evaluateInJSThreadIfDefinedBlocking(runtime) {
        get(key).handleValue(format)
    }

    override fun <R> getInvokable(key: String, deserializationStrategy: DeserializationStrategy<R>): Invokable<R>? = v8Object.evaluateInJSThreadIfDefinedBlocking(runtime) {
        get(key) as? V8Function
    }?.toInvokable(format, v8Object, deserializationStrategy)

    override fun <R> getFunction(key: String): Invokable<R>? = v8Object.evaluateInJSThreadIfDefinedBlocking(runtime) {
        get(key) as? V8Function
    }?.toInvokable(format, v8Object, null)

    override fun getList(key: String): List<*>? = v8Object.evaluateInJSThreadIfDefinedBlocking(runtime) {
        get(key) as? V8Array
    }?.toList(format)

    override fun getObject(key: String): Node? = v8Object.evaluateInJSThreadIfDefinedBlocking(runtime) {
        get(key) as? V8Object
    }?.toNode(format)

    override fun <T> getSerializable(key: String, deserializer: DeserializationStrategy<T>): T? = v8Object.evaluateInJSThreadBlocking(runtime) {
        getV8Value(this@V8Node.runtime, key).mapUndefinedToNull()?.let {
            format.decodeFromRuntimeValue(deserializer, it)
        }
    }

    override fun <T> deserialize(deserializer: DeserializationStrategy<T>): T = format.decodeFromRuntimeValue(deserializer, v8Object)

    override fun isReleased(): Boolean = v8Object.isReleased

    override fun isUndefined() = v8Object.isUndefined

    override fun nativeReferenceEquals(other: Any?): Boolean = when (other) {
        is NodeWrapper -> nativeReferenceEquals(other.node)
        is V8ObjectWrapper -> nativeReferenceEquals(other.v8Object)
        is V8Object -> v8Object.evaluateInJSThreadBlocking(runtime) {
            v8Object.strictEquals(other)
        }
        else -> false
    }

    override fun equals(other: Any?): Boolean = when (other) {
        is Map<*, *> -> keys == other.keys && keys.all {
            get(it) == other[it]
        }
        is NodeWrapper -> equals(other.node)
        is V8ObjectWrapper -> equals(other.v8Object)
        is V8Object -> equals(V8Node(other, runtime))
        else -> false
    }

    override fun hashCode(): Int = v8Object.evaluateInJSThreadBlocking(runtime) { hashCode() }

    override fun toString(): String = v8Object.evaluateInJSThreadIfDefinedBlocking(runtime) {
        keys.associate { it to get(it) }.toString()
    } ?: emptyMap<String, Any?>().toString()
}
