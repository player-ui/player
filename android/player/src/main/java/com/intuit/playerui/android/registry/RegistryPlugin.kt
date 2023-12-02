package com.intuit.playerui.android.registry

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.plugins.JSPluginWrapper

internal class RegistryPlugin<T> : JSPluginWrapper {

    override lateinit var instance: Node private set

    private val registry = mutableListOf<T>()

    /** apply core transforms */
    override fun apply(runtime: Runtime<*>) {
        runtime.execute(readSource("plugins/partial-match-fingerprint/core/dist/partial-match-fingerprint-plugin.prod.js"))
        runtime.execute(readSource("core/partial-match-registry/dist/partial-match-registry.prod.js"))
        instance = runtime.execute(
            """(new PartialMatchFingerprintPlugin.PartialMatchFingerprintPlugin(new Registry.Registry()))""",
        ) as Node
    }

    fun register(match: Map<String, Any>, value: T) {
        registry.add(value)
        instance.getInvokable<Unit>("register")!!.invoke(match, registry.size - 1)
    }

    /**
     * Retrieves an asset type from the partial match registry based on the id
     * @param id The id of the asset to get the type for
     * @return asset type
     */
    operator fun get(id: String): T? = getAssetIndex(id)?.let(registry::getOrNull)

    private fun getAssetIndex(id: String): Int? = instance.getInvokable<Any?>("get")!!.invoke(id) as? Int

    private fun readSource(source: String) = RegistryPlugin::class.java.classLoader!!
        .getResource(source)
        .readText()
}
