package com.intuit.playerui.core.data

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.serializers.Function1Serializer
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.data.DataController.Serializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer

/** Limited definition of the player data controller to enable data modification */
@Serializable(with = Serializer::class)
public class DataController internal constructor(override val node: Node) : NodeWrapper {

    private val set: Invokable<Unit> by NodeSerializableFunction(
        Function1Serializer(MapSerializer(String.serializer(), GenericSerializer()), GenericSerializer()),
    )

    /** Apply [data] to the underlying data model */
    public fun set(data: Map<String, Any?>) {
        set.invoke(data)
    }

    /** [set] each of the [Binding]s contained in the [transaction] */
    public fun set(transaction: List<List<Any?>>) {
        // TODO: this unfortunately doesn't work yet because it's also got the name "set"
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
