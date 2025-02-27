package com.intuit.playerui.core.logger

import com.intuit.hooks.HookContext
import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook1
import com.intuit.playerui.core.bridge.hooks.SyncHook1
import com.intuit.playerui.core.bridge.runtime
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.plugins.LoggerPlugin
import kotlinx.coroutines.launch
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
            ListSerializer(GenericSerializer()),
        ).toTypedArrayHook()

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    private val trace: Invokable<Unit> by NodeSerializableFunction()
    private val debug: Invokable<Unit> by NodeSerializableFunction()
    private val info: Invokable<Unit> by NodeSerializableFunction()
    private val warn: Invokable<Unit> by NodeSerializableFunction()
    private val error: Invokable<Unit> by NodeSerializableFunction()

    public override fun trace(vararg args: Any?) {
        runtime.scope.launch {
            trace.invoke(*args)
        }
    }

    public override fun debug(vararg args: Any?) {
        runtime.scope.launch {
            debug.invoke(*args)
        }
    }

    public override fun info(vararg args: Any?) {
        runtime.scope.launch {
            info.invoke(*args)
        }
    }

    public override fun warn(vararg args: Any?) {
        runtime.scope.launch {
            warn.invoke(*args)
        }
    }

    public override fun error(vararg args: Any?) {
        runtime.scope.launch {
            error.invoke(*args)
        }
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
