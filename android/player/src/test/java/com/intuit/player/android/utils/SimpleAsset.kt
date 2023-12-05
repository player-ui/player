package com.intuit.player.android.utils

import android.view.View
import android.widget.TextView
import com.intuit.player.android.AssetContext
import com.intuit.player.android.asset.DecodableAsset
import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.runtime.serialize
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.j2v8.bridge.runtime.J2V8
import com.intuit.player.jvm.utils.makeFlow
import kotlinx.serialization.json.Json

@Suppress("DEPRECATION_ERROR")
internal class SimpleAsset(assetContext: AssetContext) : DecodableAsset<Node>(assetContext, Node.serializer()) {

    override fun initView() = TextView(context)

    override fun View.hydrate() = Unit

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
