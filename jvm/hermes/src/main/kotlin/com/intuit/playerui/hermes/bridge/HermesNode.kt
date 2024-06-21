package com.intuit.playerui.hermes.bridge

import com.facebook.jni.HybridData
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.Runtime
import kotlinx.serialization.DeserializationStrategy
import kotlin.collections.Map.Entry

public class HermesNode(private val hybridData: HybridData) : Node {


    override fun <T> getSerializable(key: String, deserializer: DeserializationStrategy<T>): T? {
        TODO("Not yet implemented")
    }

    override fun <T> deserialize(deserializer: DeserializationStrategy<T>): T {
        TODO("Not yet implemented")
    }

    override fun isReleased(): Boolean {
        TODO("Not yet implemented")
    }

    override fun isUndefined(): Boolean {
        TODO("Not yet implemented")
    }

    override fun nativeReferenceEquals(other: Any?): Boolean {
        TODO("Not yet implemented")
    }

    override val runtime: Runtime<*>
        get() = TODO("Not yet implemented")
    override val entries: Set<Entry<String, Any?>>
        get() = TODO("Not yet implemented")
    override val keys: Set<String>
        get() = TODO("Not yet implemented")
    override val size: Int
        get() = TODO("Not yet implemented")
    override val values: Collection<Any?>
        get() = TODO("Not yet implemented")

    override fun containsKey(key: String): Boolean {
        TODO("Not yet implemented")
    }

    override fun containsValue(value: Any?): Boolean {
        TODO("Not yet implemented")
    }

    override fun get(key: String): Any? {
        TODO("Not yet implemented")
    }

    override fun isEmpty(): Boolean {
        TODO("Not yet implemented")
    }
}
