package com.intuit.playerui.core.data

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.data.DataModelWithParser.Serializer
import kotlinx.serialization.Serializable

// TODO: Initial support for bindings as [String]s, expand this to support all [BindingLike] types
// TODO: Evaluate the advantages between [Map] and [JsonObject]
/** Data model handle that provides [get] and [set] functionality w/ binding resolution */
@Serializable(Serializer::class)
public class DataModelWithParser internal constructor(override val node: Node) : NodeWrapper {
    /** Retrieve specific section of the data model resolved from the [binding] */
    public fun get(binding: Binding): Any? {
        return node.getInvokable<Any?>("get")?.invoke(binding)
    }

    /** [set] each of the [Binding]s contained in the [transaction] */
    public fun set(transaction: List<List<Any?>>) {
        node.getInvokable<Unit>("set")?.invoke(transaction)
    }

    internal object Serializer : NodeWrapperSerializer<DataModelWithParser>(::DataModelWithParser)
}

/** Convenience helper to [DataModelWithParser.get] the entire data model */
public fun DataModelWithParser.get(): Map<String, Any?> = get("") as? Map<String, Any?> ?: emptyMap()

/** Convenience helper to [DataModelWithParser.set] a collection of [Binding]s */
public fun DataModelWithParser.set(vararg transactions: Pair<Binding, Any?>) {
    set(transactions.map { (binding, value) -> listOf(binding, value) })
}
