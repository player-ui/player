package com.intuit.playerui.graaljs.player

import org.graalvm.polyglot.Context

internal object PlayerContextFactory {

    val context get() = buildPlayerContext()

    fun buildPlayerContext(): Context = Context
        .newBuilder("js")
        .allowAllAccess(true)
        .allowExperimentalOptions(true)
        // needed for collection methods on ProxyArray and ProxyObject
        .option("js.experimental-foreign-object-prototype", "true")
        .option("engine.WarnInterpreterOnly", "false")
        .build()
}
