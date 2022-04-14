package com.intuit.player.jvm.graaljs.bridge

import org.graalvm.polyglot.Value

internal interface GraalObjectWrapper {
    val graalObject: Value
}
