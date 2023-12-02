package com.intuit.playerui.graaljs.bridge

import org.graalvm.polyglot.Value

internal interface GraalObjectWrapper {
    val graalObject: Value
}
