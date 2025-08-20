package com.intuit.playerui.plugins.expression

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper

// TODO: Turn into functional interface
public typealias ExpressionHandler = (List<Any?>) -> Any?

/**
 * The ExpressionPlugin is an easy way to inject custom expression handlers into the running player instance.
 * Simply supply a map of function name to handler, and the expressions will be available inside of the content.
 *
 * Any subsequent expressions registered with the same name will override previous handlers.
 */
public class ExpressionPlugin(
    public val map: Map<String, ExpressionHandler>,
) : JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH) {
    public constructor(vararg expressions: Pair<String, ExpressionHandler>) : this(expressions.toMap())

    override fun apply(runtime: Runtime<*>) {
        runtime.load(ScriptContext(script, BUNDLED_SOURCE_PATH))
        runtime.add(
            "expressionHandlers",
            map.entries.fold(runtime.execute("new Map()") as Node) { acc, entry ->
                acc.apply {
                    val (name, handler) = entry
                    getInvokable<Any?>("set")!!.invoke(
                        name,
                        Invokable { args ->
                            handler.invoke(args.drop(1))
                        },
                    )
                }
            },
        )
        instance = runtime.buildInstance("(new $name(expressionHandlers))")
    }

    private companion object {
        private const val BUNDLED_SOURCE_PATH = "plugins/expression/core/dist/ExpressionPlugin.native.js"
        private const val PLUGIN_NAME = "ExpressionPlugin.ExpressionPlugin"
    }
}
