package com.intuit.playerui.plugins.asyncnode

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeAsyncParallelBailHook1
import com.intuit.playerui.core.bridge.hooks.NodeAsyncParallelBailHook2
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.serialization.serializers.*
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
        runtime.load(ScriptContext(script, bundledSourcePath))
        instance = runtime.buildInstance("(new $pluginName({plugins: [new AsyncNodePlugin.AsyncNodePluginPlugin()]}))")
        hooks = instance.getSerializable("hooks", Hooks.serializer()) ?: throw PlayerException("AsyncNodePlugin is not loaded correctly")
    }

    @Serializable(with = Hooks.Serializer::class)
    public class Hooks internal constructor(override val node: Node) : NodeWrapper {
        /** The hook right before the View starts resolving. Attach anything custom here */
        public val onAsyncNode: NodeAsyncParallelBailHook2<Node, (Map<String, Any?>) -> Unit, List<Map<String, Any?>>> by NodeSerializableField(NodeAsyncParallelBailHook2.serializer(NodeSerializer(), Function1Serializer(MapSerializer(String.serializer(), GenericSerializer()), GenericSerializer()), ListSerializer(MapSerializer(String.serializer(), GenericSerializer()))))
        internal object Serializer : NodeWrapperSerializer<Hooks>(AsyncNodePlugin::Hooks)
    }

    private companion object {
        private const val bundledSourcePath = "plugins/async-node/core/dist/AsyncNodePlugin.native.js"
        private const val pluginName = "AsyncNodePlugin.AsyncNodePlugin"
    }
}

/** Convenience getter to find the first [AsyncNodePlugin] registered to the [Player] */
public val Player.asyncNodePlugin: AsyncNodePlugin? get() = findPlugin()
