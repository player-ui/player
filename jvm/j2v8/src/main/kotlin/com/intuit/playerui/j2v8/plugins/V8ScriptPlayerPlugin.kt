package com.intuit.playerui.j2v8.plugins

import com.intuit.playerui.core.plugins.JSScriptPluginWrapper

@Deprecated(
    "Replaced with more generic JSScriptPluginWrapper",
    ReplaceWith("JSScriptPluginWrapper"),
    DeprecationLevel.HIDDEN,
)
public typealias V8ScriptPlayerPlugin = JSScriptPluginWrapper

@Deprecated(
    "Replaced with more generic V8ScriptPluginWrapper",
    ReplaceWith("JSScriptPluginWrapper"),
    DeprecationLevel.HIDDEN,
)
public abstract class V8ScriptPluginWrapper(
    name: String,
    script: String,
) : JSScriptPluginWrapper(name, script = script) {
    public constructor(
        name: String,
        sourcePath: String,
        classLoader: ClassLoader = JSScriptPluginWrapper::class.java.classLoader!!,
    ) : this(name, classLoader.getResource(sourcePath)!!.readText())
}
