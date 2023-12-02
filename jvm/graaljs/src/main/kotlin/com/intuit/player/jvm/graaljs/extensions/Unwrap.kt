package com.intuit.playerui.graaljs.extensions

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.graaljs.bridge.GraalNode
import org.graalvm.polyglot.Value

internal fun Node.unwrap(): Value? = when (this) {
    is GraalNode -> graalObject
    is NodeWrapper -> node.unwrap()
    else -> null
}

internal fun NodeWrapper.unwrap(): Value? = node.unwrap()
