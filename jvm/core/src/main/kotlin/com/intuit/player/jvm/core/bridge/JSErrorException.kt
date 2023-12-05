package com.intuit.player.jvm.core.bridge

import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.ThrowableSerializer
import com.intuit.player.jvm.core.player.PlayerException
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer

public class JSErrorException(
    override val node: Node,
    cause: Throwable? = node.getSerializable("innerErrors", ListSerializer(ThrowableSerializer()))?.first(),
) : PlayerException(node.getString("message") ?: "", cause), NodeWrapper {

    public val name: String by NodeSerializableField(String.serializer()) {
        "Error"
    }

    override val message: String = "$name: ${super.message}"
}
