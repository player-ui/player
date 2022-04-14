package com.intuit.player.jvm.core.asset

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.player.PlayerException
import kotlinx.serialization.Serializable

/** Convenience helper to get some [value] from an [Asset] */
public val Asset.value: String? get() = get("value") as? String

/** Special [Node] type that also describes a player asset */
@Serializable(with = Asset.Serializer::class)
public open class Asset(override val node: Node) : Node by node, NodeWrapper {
    public val id: String get() = getString("id") ?: throw PlayerException("Asset's must be described with an ID")
    public operator fun component1(): String = id

    public val type: String get() = getString("type") ?: throw PlayerException("Asset's must be described with a type")
    public operator fun component2(): String = type

    public val metaData: MetaData? get() = getObject("metaData")?.let(::MetaData)
    public operator fun component3(): MetaData? = metaData

    public fun getAsset(name: String): AssetWrapper? = getObject(name)?.let(::AssetWrapper)

    override fun equals(other: Any?): Boolean = node == other

    override fun hashCode(): Int = node.hashCode()

    override fun toString(): String = node.toString()

    internal object Serializer : NodeWrapperSerializer<Asset>(::Asset)
}
