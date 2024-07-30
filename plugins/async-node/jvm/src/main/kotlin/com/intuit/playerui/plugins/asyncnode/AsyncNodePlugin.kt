package com.intuit.playerui.plugins.asyncnode

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeAsyncParallelBailHook1
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.findPlugin
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer

public class AsyncNodePlugin : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath) {

    public lateinit var hooks: Hooks

    override fun apply(runtime: Runtime<*>) {
        runtime.execute(script)
        instance = runtime.buildInstance("(new $name())")
        hooks = instance.getSerializable("hooks", Hooks.serializer()) ?: throw PlayerException("AsyncNodePlugin is not loaded correctly")
    }

    @Serializable(with = Hooks.Serializer::class)
    public class Hooks internal constructor(override val node: Node) : NodeWrapper {
        /** The hook right before the View starts resolving. Attach anything custom here */
        public val onAsyncNode: NodeAsyncParallelBailHook1<Node, List<Map<String, Any?>>> by NodeSerializableField(NodeAsyncParallelBailHook1.serializer(NodeSerializer(), ListSerializer(MapSerializer(String.serializer(), GenericSerializer()))))
        internal object Serializer : NodeWrapperSerializer<Hooks>(AsyncNodePlugin::Hooks)
    }

    private companion object {
        private const val bundledSourcePath = "async-node-plugin.js"
        private const val pluginName = "AsyncNodePlugin"
    }
}

/** Convenience getter to find the first [PubSubPlugin] registered to the [Player] */
public val Player.asyncNodePlugin: AsyncNodePlugin? get() = findPlugin()