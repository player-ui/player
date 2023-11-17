package com.intuit.player.jvm.j2v8.extensions

import com.eclipsesource.v8.V8Object
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.j2v8.bridge.V8Node

/** Extension to recursively unwrap [NodeWrapper]s until we hit a [Node] implementation */
internal fun Node.unwrap(): V8Object? = when (this) {
    is V8Node -> v8Object
    is NodeWrapper -> node.unwrap()
    else -> null
}

internal fun NodeWrapper.unwrap(): V8Object? = node.unwrap()
