package com.intuit.playerui.android.utils

import android.view.View
import kotlinx.coroutines.CoroutineScope
import android.widget.ImageView
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.runtimeFactory
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializer
import com.intuit.playerui.utils.makeFlow
import kotlinx.serialization.json.Json

internal class OtherSimpleAsset(
    assetContext: AssetContext,
) : RenderableAsset<Node>(assetContext, NodeSerializer()) {
    override suspend fun initView(data: Node) = ImageView(context)

    override suspend fun CoroutineScope.hydrate(view: View, data: Node) = Unit

    companion object {
        val sampleMap = mapOf(
            "id" to "some-id",
            "type" to "simple",
            "metaData" to mapOf("role" to "other"),
        )
        val sampleAsset: Asset = runtimeFactory.create().serialize(sampleMap) as Asset
        val sampleJson = Json.encodeToJsonElement(GenericSerializer(), sampleMap)
        val sampleFlow = makeFlow(sampleJson)
    }
}
