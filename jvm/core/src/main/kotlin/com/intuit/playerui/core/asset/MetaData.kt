package com.intuit.playerui.core.asset

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull

/**
 * Base structure containing common metadata fields.
 * [node] is exposed to enable retrieval of other fields.
 * This could also be done by extending this class.
 */
@Serializable(MetaData.Serializer::class)
public open class MetaData(
    override val node: Node,
) : NodeWrapper {
    /** [JsonElement] representation of some [beacon] description */
    public val beacon: JsonElement by NodeSerializableField(JsonElement.serializer()) { JsonNull }

    /** Common metadata element used to designate how an asset should present itself by describing the intent */
    public val role: String? by NodeSerializableField(String.serializer().nullable)

    /** [ref] is typically used to describe a reference to some external location */
    public val ref: String? by NodeSerializableField(String.serializer().nullable)

    internal object Serializer : NodeWrapperSerializer<MetaData>(::MetaData)
}
