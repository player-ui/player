package com.intuit.playerui.core.data

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable

/** Read-only access to the data model — the base for [DataController] */
@Serializable(with = ReadOnlyDataController.Serializer::class)
public open class ReadOnlyDataController internal constructor(
    override val node: Node,
) : NodeWrapper {
    private val get: Invokable<Any?>? by NodeSerializableFunction()

    /** Retrieve the value at the given [binding] */
    public fun get(binding: Binding): Any? = get?.invoke(binding)

    /**
     * Serializer that picks the concrete type based on whether the underlying JS object
     * exposes a [set] function: mutable controllers become [DataController], read-only ones
     * stay as [ReadOnlyDataController].
     */
    internal object Serializer : NodeWrapperSerializer<ReadOnlyDataController>(
        { node ->
            if (node.getObject("set") != null) {
                DataController(node)
            } else {
                ReadOnlyDataController(node)
            }
        },
    )
}

/** Convenience helper to [ReadOnlyDataController.get] the entire data model */
public fun ReadOnlyDataController.get(): Map<String, Any?> = get("") as? Map<String, Any?> ?: emptyMap()
