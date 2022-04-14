package com.intuit.player.jvm.core.asset

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.player.PlayerException

/**
 * Container for an [Asset] definition. [node] is exposed because there might be metaData at the wrapper level.
 */
public class AssetWrapper(override val node: Node) : NodeWrapper {
    public val asset: Asset get() = node.getObject("asset") as? Asset
        ?: throw PlayerException("AssetWrapper is not wrapping a valid asset")
}
