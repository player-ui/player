package com.intuit.playerui.android.debug

import com.alexii.j2v8debugger.ScriptSourceProvider
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.player.PlayerException

internal class UnsupportedScriptProvider(private val runtime: Runtime<*>) : ScriptSourceProvider {
    override val allScriptIds: Collection<String>
        get() = throw PlayerException("Unsupported exception, $runtime runtime does not support JS debugging")

    override fun getSource(scriptId: String): String {
        throw PlayerException("Unsupported exception, $runtime runtime does not support JS debugging")
    }
}
