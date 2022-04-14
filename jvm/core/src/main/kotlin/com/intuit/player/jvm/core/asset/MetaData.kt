package com.intuit.player.jvm.core.asset

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.getJson
import kotlinx.serialization.json.JsonElement

/**
 * Base structure containing common metadata fields.
 * [node] is exposed to enable retrieval of other fields.
 * This could also be done by extending this class.
 */
public open class MetaData(override val node: Node) : NodeWrapper {

    /** [JsonElement] representation of some [beacon] description */
    public val beacon: JsonElement get() = node.getJson("beacon")

    /** Common metadata element used to designate how an asset should present itself by describing the intent */
    public val role: String? get() = node.getString("role")

    /** [ref] is typically used to describe a reference to some external location */
    public val ref: String? get() = node.getString("ref")
}
