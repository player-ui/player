package com.intuit.playerui.android.utils

import android.view.View
import android.widget.ImageView
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.SuspendableAsset
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializer
import com.intuit.playerui.j2v8.bridge.runtime.J2V8
import com.intuit.playerui.utils.makeFlow
import kotlinx.serialization.json.Json

@Suppress("DEPRECATION_ERROR")
internal class OtherSimpleAsset(assetContext: AssetContext) : SuspendableAsset<Node>(assetContext, NodeSerializer()) {

    override suspend fun initView(data: Node) = ImageView(context)

    override suspend fun View.hydrate(data: Node) = Unit

    companion object {
        val sampleMap = mapOf(
            "id" to "some-id",
            "type" to "simple",
            "metaData" to mapOf("role" to "other"),
        )
        val sampleAsset: Asset = J2V8.create().serialize(sampleMap) as Asset
        val sampleJson = Json.encodeToJsonElement(GenericSerializer(), sampleMap)
        val sampleFlow = makeFlow(sampleJson)
    }
}
