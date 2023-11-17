package com.intuit.player.jvm.core.logger

import com.intuit.hooks.HookContext
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncHook1
import com.intuit.player.jvm.core.bridge.hooks.SyncHook1
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField.Companion.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.plugins.LoggerPlugin
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer

@Serializable(with = TapableLogger.Serializer::class)
public class TapableLogger(override val node: Node) : LoggerPlugin, NodeWrapper {

    @Serializable(Hooks.Serializer::class)
    public class Hooks internal constructor(override val node: Node) : NodeWrapper {
        public val trace: SyncHook1<Array<Any?>> = loggerHook("trace")
        public val debug: SyncHook1<Array<Any?>> = loggerHook("debug")
        public val info: SyncHook1<Array<Any?>> = loggerHook("info")
        public val warn: SyncHook1<Array<Any?>> = loggerHook("warn")
        public val error: SyncHook1<Array<Any?>> = loggerHook("error")

        private fun loggerHook(key: String) = NodeSyncHook1(
            node.getObject(key)!!,
            ListSerializer(GenericSerializer())
        ).toTypedArrayHook()

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    public override fun trace(vararg args: Any?) {
        node.getInvokable<Unit>("trace")!!(*args)
    }

    public override fun debug(vararg args: Any?) {
        node.getInvokable<Unit>("debug")!!(*args)
    }

    public override fun info(vararg args: Any?) {
        node.getInvokable<Unit>("info")!!(*args)
    }

    public override fun warn(vararg args: Any?) {
        node.getInvokable<Unit>("warn")!!(*args)
    }

    public override fun error(vararg args: Any?) {
        node.getInvokable<Unit>("error")!!(*args)
    }

    public fun addHandler(logger: LoggerPlugin) {
        hooks.trace.tap(logger::trace)
        hooks.debug.tap(logger::debug)
        hooks.info.tap(logger::info)
        hooks.warn.tap(logger::warn)
        hooks.error.tap(logger::error)
    }

    internal object Serializer : NodeWrapperSerializer<TapableLogger>(::TapableLogger)
}

private fun SyncHook1<List<Any?>?>.toTypedArrayHook() = object : SyncHook1<Array<Any?>>() {
    init {
        this@toTypedArrayHook.tap { context, args ->
            call(context, args?.toTypedArray() ?: emptyArray())
        }
    }

    fun call(context: HookContext, flattenedArgs: Array<Any?>) {
        call { f, _ -> f(context, flattenedArgs) }
    }
}
