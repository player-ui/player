package com.intuit.player.jvm.core.bridge

import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.player.jvm.core.player.PlayerException
import kotlinx.serialization.builtins.serializer

public class JSErrorException(override val node: Node, cause: Throwable? = null) : PlayerException(node.getString("message") ?: "", cause), NodeWrapper {

    public val name: String by NodeSerializableField(String.serializer()) {
        "Error"
    }

    override val message: String
        get() = "$name: ${super.message}"
}
