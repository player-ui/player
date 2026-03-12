package com.intuit.playerui.core.data

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable

/** Read-only wrapper around the DataController, providing data access after a flow completes without allowing mutation */
@Serializable(with = ReadOnlyDataController.Serializer::class)
public class ReadOnlyDataController internal constructor(
    override val node: Node,
) : NodeWrapper {
    private val get: Invokable<Any?>? by NodeSerializableFunction()

    /** Retrieve the value at the given [binding] */
    public fun get(binding: Binding): Any? = get?.invoke(binding)

    internal object Serializer : NodeWrapperSerializer<ReadOnlyDataController>(::ReadOnlyDataController)
}

/** Convenience helper to [ReadOnlyDataController.get] the entire data model */
public fun ReadOnlyDataController.get(): Map<String, Any?> = get("") as? Map<String, Any?> ?: emptyMap()
