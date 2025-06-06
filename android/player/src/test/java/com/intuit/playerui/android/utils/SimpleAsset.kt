package com.intuit.playerui.android.utils

import android.view.View
import android.widget.TextView
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.DecodableAsset
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.j2v8.bridge.runtime.J2V8
import com.intuit.playerui.utils.makeFlow
import kotlinx.serialization.json.Json

@Suppress("DEPRECATION_ERROR")
internal class SimpleAsset(assetContext: AssetContext) : DecodableAsset<Node>(assetContext, Node.serializer()) {

    override suspend fun initView(data: Node) = TextView(context)

    override suspend fun View.hydrate(data: Node) = Unit

    companion object {
        val sampleMap = mapOf(
            "id" to "simple-asset",
            "data" to "{{someBinding}}",
            "type" to "simple",
            "metaData" to mapOf<String, Any>("a" to "b"),
        )
        val runtime = J2V8.create()
        val sampleAsset = runtime.serialize(sampleMap) as Asset
        val sampleJson = Json.encodeToJsonElement(GenericSerializer(), sampleMap)
        val sampleFlow = makeFlow(sampleJson)
    }
}
