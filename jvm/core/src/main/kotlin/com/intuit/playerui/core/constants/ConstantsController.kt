package com.intuit.playerui.core.constants
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable

@Serializable(with = ConstantsController.Serializer::class)
public class ConstantsController(override val node: Node) : NodeWrapper {
    /**
     * Function to add constants to the providers store
     * @param data values to add to the constants store
     * @param namespace namespace to add the constants under
     */
    public fun addConstants(data: Map<String, Any>, namespace: String) {
        node.getInvokable<Unit>("addConstants")?.invoke(data, namespace)
    }

    /**
     * Function to retrieve constants from the providers store
     * @param key Key used for the store access
     * @param namespace namespace values were loaded under (defined in the plugin)
     * @param fallback Optional - if key doesn't exist in namespace what to return (will return unknown if not provided)
     */
    public fun getConstants(key: Any, namespace: String, fallback: Any? = null): Any? {
        return node.getInvokable<Any?>("getConstants")?.invoke(key, namespace, fallback)
    }

    /**
     * Function to set values to temporarily override certain keys in the permanent store
     * @param data values to override store with
     * @param namespace namespace to override
     */
    public fun setTemporaryValues(data: Any, namespace: String) {
        node.getInvokable<Unit>("setTemporaryValues")?.invoke(data, namespace)
    }

    /**
     * Clears any temporary values that were previously set
     */
    public fun clearTemporaryValues() {
        node.getInvokable<Unit>("clearTemporaryValues")?.invoke()
    }

    internal object Serializer : NodeWrapperSerializer<ConstantsController>(::ConstantsController)
}
