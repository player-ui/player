package com.intuit.playerui.utils

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.runtimeFactory
import com.intuit.playerui.core.bridge.toJson
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement

public open class MakeFlowModule internal constructor() : JSScriptPluginWrapper("MakeFlow", sourcePath = "core/make-flow/dist/MakeFlow.native.js") {

    override fun apply(runtime: Runtime<*>) {
        runtime.execute(script)
        instance = runtime.buildInstance(name)
    }

    public fun makeFlow(flow: Node): JsonElement {
        ensureInitialized()
        return instance.getInvokable<Node>("makeFlow").let(::requireNotNull)(flow).toJson()
    }

    public fun makeFlow(flow: String): JsonElement {
        ensureInitialized()
        // TODO: Test this fails each runtime
        return makeFlow(instance.runtime.execute("($flow)") as Node)
    }

    private fun ensureInitialized() {
        if (!isInstantiated) {
            apply(runtimeFactory.create())
        }
    }

    public companion object : MakeFlowModule()
}

private val makeFlowModule by lazy(::MakeFlowModule)

public fun makeFlow(flow: JsonElement): JsonElement = makeFlow(Json.encodeToString(flow))

public fun makeFlow(flow: String): JsonElement = MakeFlowModule.makeFlow(flow)

public fun makeFlow(flow: Node): JsonElement = makeFlowModule.makeFlow(flow)
