package com.alexii.j2v8debugger

/** Redundant declaration of [ScriptSourceProvider] to ensure it exists on classpath at runtime */
public interface ScriptSourceProvider {
    public val allScriptIds: Collection<String>

    public fun getSource(scriptId: String): String
}
