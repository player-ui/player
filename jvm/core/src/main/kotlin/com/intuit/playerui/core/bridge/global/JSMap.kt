package com.intuit.playerui.core.bridge.global

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable

@Serializable(with = JSMap.Serializer::class)
public class JSMap<K, V>(
    override val node: Node,
    keySerializer: KSerializer<K>,
    valueSerializer: KSerializer<V>,
) : Map<K, V>,
    NodeWrapper {
    override val keys: Set<K> by lazy {
        JSIterator(node.getInvokable<Node>("keys")!!(), keySerializer).asSequence().toSet()
    }

    override val values: List<V> by lazy {
        JSIterator(node.getInvokable<Node>("values")!!(), valueSerializer).asSequence().toList()
    }

    override val entries: Set<Map.Entry<K, V>> by lazy {
        keys.zip(values).toMap().entries
    }

    override val size: Int by lazy {
        keys.size
    }

    override fun containsKey(key: K): Boolean = keys.contains(key)

    override fun containsValue(value: V): Boolean = values.contains(value)

    override fun get(key: K): V? = entries.firstOrNull { it.key == key }?.value

    override fun isEmpty(): Boolean = size == 0

    internal class Serializer<K, V>(
        private val keySerializer: KSerializer<K>,
        private val valueSerializer: KSerializer<V>,
    ) : NodeWrapperSerializer<JSMap<K, V>>({
            JSMap(it, keySerializer, valueSerializer)
        })
}
