package com.intuit.playerui.core.data

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.data.DataController.Serializer
import kotlinx.serialization.Serializable

/** Mutable data controller — extends [ReadOnlyDataController] to also allow writes */
@Serializable(with = Serializer::class)
public class DataController internal constructor(
    node: Node,
) : ReadOnlyDataController(node) {
    private val set: Invokable<Any?>? by NodeSerializableFunction()

    /** Apply [data] to the underlying data model */
    public fun set(data: Map<String, Any?>) {
        set?.invoke(data)
    }

    /** [set] each of the [Binding]s contained in the [transaction] */
    public fun set(transaction: List<List<Any?>>) {
        set?.invoke(transaction)
    }

    internal object Serializer : NodeWrapperSerializer<DataController>(::DataController)
}

/** Convenience helper to [DataController.set] a collection of [Binding]s */
public fun DataController.set(vararg transactions: Pair<Binding, Any?>) {
    set(transactions.map { (binding, value) -> listOf(binding, value) })
}
