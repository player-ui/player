package com.intuit.playerui.core.asset

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.getSerializable
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.player.PlayerException
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer

/** Convenience helper to get some [value] from an [Asset] */
public val Asset.value: String? get() = get("value") as? String

/** Special [Node] type that also describes a player asset */
@Serializable(with = Asset.Serializer::class)
public open class Asset(
    override val node: Node,
) : Node by node,
    NodeWrapper {
    public val id: String by NodeSerializableField(String.serializer(), NodeSerializableField.CacheStrategy.Full) {
        throw PlayerException("Asset's must be described with an ID")
    }

    public operator fun component1(): String = id

    public val type: String by NodeSerializableField(String.serializer(), NodeSerializableField.CacheStrategy.Full) {
        throw PlayerException("Asset's must be described with a type")
    }

    public operator fun component2(): String = type

    public val metaData: MetaData? by NodeSerializableField(MetaData.serializer().nullable)

    public operator fun component3(): MetaData? = metaData

    public fun getAsset(name: String): AssetWrapper? = getSerializable(name)

    override fun equals(other: Any?): Boolean = node == other

    override fun hashCode(): Int = node.hashCode()

    override fun toString(): String = node.toString()

    internal object Serializer : NodeWrapperSerializer<Asset>(::Asset)
}
