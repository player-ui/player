package com.intuit.playerui.core.plugins

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext

/**
 * Convenience construct to instantiate a JS player plugin. By default, this will
 * instantiate it with no parameters. If a plugin requires some parameters, subclasses
 * can override [apply] to instantiate the plugin with the required parameters. The [script]
 * can be passed in directly as a [String], or can be passed as a classpath location
 * and be read from the provided [ClassLoader].
 */
public abstract class JSScriptPluginWrapper(
    public val name: String,
    protected val script: String,
    private val sourcePath: String? = null,
    private val preCompiledScript: ByteArray? = null,
) : JSPluginWrapper {
    public constructor(name: String, sourcePath: String, classLoader: ClassLoader = JSScriptPluginWrapper::class.java.classLoader) :
        this(
            name,
            classLoader.getResource(sourcePath)!!.readText(),
            sourcePath,
            classLoader.getResource(hbcPathFor(sourcePath))?.readBytes(),
        )

    final override lateinit var instance: Node protected set

    public val isInstantiated: Boolean get() = ::instance.isInitialized

    override fun apply(runtime: Runtime<*>) {
        runtime.load(
            ScriptContext(script, sourcePath ?: "$name.js").apply {
                preCompiledScript = this@JSScriptPluginWrapper.preCompiledScript
            },
        )
        instance = runtime.buildInstance()
    }

    public fun Runtime<*>.buildInstance(script: String = "(new $name())"): Node = execute(script) as? Node
        ?: throw PlayerPluginException("Could not instantiate JS plugin: $name")

    public companion object {
        /**
         * Maps a native bundle source path to its sibling Hermes bytecode resource,
         * e.g. `plugins/x/core/dist/XPlugin.native.js` -> `plugins/x/core/XPlugin.native.js.hbc`.
         */
        private fun hbcPathFor(sourcePath: String): String =
            "${sourcePath.substringBeforeLast("/dist/")}/${sourcePath.substringAfterLast("/")}.hbc"

        /** Convenience helper to expose constructor as an anonymous builder */
        public fun from(
            name: String,
            sourcePath: String,
            classLoader: ClassLoader = JSScriptPluginWrapper::class.java.classLoader,
        ): JSScriptPluginWrapper = object : JSScriptPluginWrapper(name, sourcePath, classLoader) {}

        /** Convenience helper to expose constructor as an anonymous builder */
        public fun from(name: String, script: String): JSScriptPluginWrapper = object : JSScriptPluginWrapper(name, script = script) {}
    }
}

public fun JSScriptPluginWrapper.PlayerPluginException(message: String): PlayerPluginException = PlayerPluginException(name, message)
