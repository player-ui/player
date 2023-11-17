package com.intuit.player.jvm.graaljs.extensions

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.graaljs.bridge.GraalNode
import org.graalvm.polyglot.Value

internal fun Node.unwrap(): Value? = when (this) {
    is GraalNode -> graalObject
    is NodeWrapper -> node.unwrap()
    else -> null
}

internal fun NodeWrapper.unwrap(): Value? = node.unwrap()
