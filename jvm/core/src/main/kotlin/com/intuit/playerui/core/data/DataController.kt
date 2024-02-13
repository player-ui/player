package com.intuit.playerui.core.data

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.data.DataController.Serializer
import kotlinx.serialization.Serializable

/** Limited definition of the player data controller to enable data modification */
@Serializable(with = Serializer::class)
public class DataController internal constructor(override val node: Node) : NodeWrapper {
    /** Apply [data] to the underlying data model */
    public fun set(data: Map<String, Any?>) {
        node.getInvokable<Unit>("set")?.invoke(data)
    }

    /** [set] each of the [Binding]s contained in the [transaction] */
    public fun set(transaction: List<List<Any?>>) {
        node.getInvokable<Unit>("set")?.invoke(transaction)
    }

    public fun get(binding: Binding): Any? = node.getInvokable<Any?>("get")?.invoke(binding)

    internal object Serializer : NodeWrapperSerializer<DataController>(::DataController)
}

/** Convenience helper to [DataModelWithParser.get] the entire data model */
public fun DataController.get(): Map<String, Any?> = get("") as? Map<String, Any?> ?: emptyMap()

/** Convenience helper to [DataModelWithParser.set] a collection of [Binding]s */
public fun DataController.set(vararg transactions: Pair<Binding, Any?>) {
    set(transactions.map { (binding, value) -> listOf(binding, value) })
}
