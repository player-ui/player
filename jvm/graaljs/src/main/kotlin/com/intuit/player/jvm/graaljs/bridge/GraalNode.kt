package com.intuit.player.jvm.graaljs.bridge

import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeFormat
import com.intuit.player.jvm.graaljs.bridge.runtime.GraalRuntime.Companion.isReleased
import com.intuit.player.jvm.graaljs.bridge.runtime.GraalRuntime.Companion.undefined
import com.intuit.player.jvm.graaljs.extensions.*
import com.intuit.player.jvm.graaljs.extensions.handleValue
import com.intuit.player.jvm.graaljs.extensions.toList
import com.intuit.player.jvm.graaljs.extensions.toNode
import kotlinx.serialization.DeserializationStrategy
import org.graalvm.polyglot.Value

/** Pseudo constructor to create a [Node] from a [Value] */
public fun Runtime<Value>.Node(obj: Value): Node = GraalNode(obj, this)

internal open class GraalNode(override val graalObject: Value, override val runtime: Runtime<Value>) : Node, GraalObjectWrapper {

    override val format: RuntimeFormat<Value>
        get() = runtime.format

    override val keys: Set<String> by lazy {
        graalObject.lockIfDefined {
            graalObject.memberKeys.filter {
                !graalObject.getMember(it).equals(context.undefined)
            }.toSet()
        } ?: emptySet()
    }

    override val size: Int by lazy { keys.size }

    override val values: List<Any?> by lazy {
        keys.map(::get)
    }

    override val entries: Set<Map.Entry<String, Any?>> by lazy {
        keys.associateWith { get(it) }.entries
    }

    override fun containsKey(key: String): Boolean = keys.contains(key)

    override fun containsValue(value: Any?): Boolean = values.contains(value)

    override fun getObject(key: String): Node? = graalObject.lockIfDefined {
        graalObject.getMember(key)
    }?.toNode(format)

    override fun isEmpty(): Boolean = size == 0

    override operator fun get(key: String): Any? = graalObject.lockIfDefined {
        getMember(key)
    }?.handleValue(format)

    override fun <R> getFunction(key: String): Invokable<R>? = graalObject.lockIfDefined {
        graalObject.getMember(key)
    }?.toInvokable(format)

    override fun getList(key: String): List<*>? = graalObject.lockIfDefined {
        graalObject.getMember(key)
    }?.toList(format)

    override fun <T> getSerializable(key: String, deserializer: DeserializationStrategy<T>): T? {
        return graalObject.blockingLock {
            if (memberKeys.contains(key))
                format.decodeFromRuntimeValue(deserializer, graalObject.getMember(key))
            else null
        }
    }

    override fun <T> deserialize(deserializer: DeserializationStrategy<T>): T = format.decodeFromRuntimeValue(deserializer, graalObject)

    override fun isReleased(): Boolean = graalObject.context.isReleased

    override fun isUndefined(): Boolean = graalObject.lockIfDefined {
        graalObject == context.undefined
    } ?: true

    override fun nativeReferenceEquals(other: Any?): Boolean {
        return when (other) {
            is NodeWrapper -> nativeReferenceEquals(other.node)
            is GraalObjectWrapper -> nativeReferenceEquals(other.graalObject)
            is Value -> graalObject.blockingLock {
                this == other
            }
            else -> false
        }
    }

    override fun equals(other: Any?): Boolean = when (other) {
        is Map<*, *> -> keys == other.keys && keys.all {
            get(it) == other[it]
        }
        is NodeWrapper -> equals(other.node)
        is GraalObjectWrapper -> equals(other.graalObject)
        is Value -> equals(GraalNode(other, runtime))
        else -> false
    }

    override fun hashCode(): Int = graalObject.blockingLock { hashCode() }

    override fun toString(): String = graalObject.lockIfDefined {
        memberKeys.associate { it to get(it) }.toString()
    } ?: emptyMap<String, Any>().toString()
}
