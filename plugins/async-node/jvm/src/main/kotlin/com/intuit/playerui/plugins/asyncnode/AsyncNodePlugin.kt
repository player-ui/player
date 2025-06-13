package com.intuit.playerui.plugins.asyncnode

import com.intuit.hooks.BailResult
import com.intuit.playerui.core.bridge.JSErrorException
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeAsyncParallelBailHook2
import com.intuit.playerui.core.bridge.hooks.NodeSyncBailHook1
import com.intuit.playerui.core.bridge.hooks.NodeSyncBailHook2
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.serialization.serializers.Function1Serializer
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.ThrowableSerializer
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.findPlugin
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.serializer

// TODO: This typing is not great - need to fix once web plugin is updated as currently web also supports type Any
public typealias asyncNodeUpdate = Any?

public typealias AsyncHandler = suspend (node: Node, callback: ((result: Any?) -> Unit)?) -> asyncNodeUpdate

public class AsyncNodePlugin(private val asyncHandler: AsyncHandler? = null) : JSScriptPluginWrapper(pluginName, sourcePath = bundledSourcePath) {

    public lateinit var hooks: Hooks

    override fun apply(runtime: Runtime<*>) {
        runtime.load(ScriptContext(script, bundledSourcePath))
        instance = runtime.buildInstance("(new $pluginName({plugins: [new AsyncNodePlugin.AsyncNodePluginPlugin()]}))")
        hooks = instance.getSerializable("hooks", Hooks.serializer())
            ?: throw PlayerException("AsyncNodePlugin is not loaded correctly")

        asyncHandler?.let { asyncHandler ->
            hooks.onAsyncNode.tap("") { _, node, callback ->
                val result = asyncHandler(node, callback)
                BailResult.Bail(result)
            }
        }
    }

    @Serializable(with = Hooks.Serializer::class)
    public class Hooks internal constructor(override val node: Node) : NodeWrapper {
        /** The hook right before the View starts resolving. Attach anything custom here */
        public val onAsyncNode: NodeAsyncParallelBailHook2<Node, (asyncNodeUpdate) -> Unit, asyncNodeUpdate> by
            NodeSerializableField(
                NodeAsyncParallelBailHook2.serializer(
                    NodeSerializer(),
                    Function1Serializer(
                        GenericSerializer(),
                        GenericSerializer(),
                    ) as KSerializer<(asyncNodeUpdate) -> Unit>,
                    GenericSerializer(),
                ),
            )

        /** The hook after an error occurs in onAsyncNode */
        public val onAsyncNodeError: NodeSyncBailHook2<PlayerException, Node, Any?> by
            NodeSerializableField(
                NodeSyncBailHook2.serializer(
                    ThrowableSerializer() as KSerializer<PlayerException>,
                NodeSerializer(),
                    GenericSerializer(),
            ),
        )

        internal object Serializer : NodeWrapperSerializer<Hooks>(AsyncNodePlugin::Hooks)
    }

    private companion object {
        private const val bundledSourcePath = "plugins/async-node/core/dist/AsyncNodePlugin.native.js"
        private const val pluginName = "AsyncNodePlugin.AsyncNodePlugin"
    }
}

/** Convenience getter to find the first [AsyncNodePlugin] registered to the [Player] */
public val Player.asyncNodePlugin: AsyncNodePlugin? get() = findPlugin()
