package com.intuit.player.jvm.core.bridge

import com.intuit.player.jvm.core.player.PlayerException

public class JSErrorException(override val node: Node, cause: Throwable? = null) : PlayerException(node.getString("message") ?: "", cause), NodeWrapper {

    public val name: String get() = node.getString("name") ?: "Error"

    override val message: String
        get() = "$name: ${super.message}"
}
