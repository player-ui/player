package com.intuit.playerui.android.utils

import android.view.View
import android.widget.LinearLayout
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.DecodableAsset
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.extensions.into
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializer
import com.intuit.playerui.j2v8.bridge.runtime.J2V8
import com.intuit.playerui.utils.makeFlow
import kotlinx.serialization.json.Json

@Suppress("DEPRECATION_ERROR")
internal class NestedAsset(assetContext: AssetContext) : DecodableAsset<Node>(assetContext, NodeSerializer()) {

    val nested = expand("nested")
    val nestedList = expandList("nestedAssets")

    override suspend fun initView(data: Node) = LinearLayout(context)

    override suspend fun View.hydrate(data: Node) {
        require(this is LinearLayout)
        nested?.render() into this
        dummy = nested
        nestedList.map {
            it.render(0)
        }.forEach { it into this }
        dummy2 = nestedList
    }

    companion object {
        val sampleMap = mapOf(
            "id" to "some-id",
            "type" to "nested",
            "metaData" to mapOf<String, Any>("a" to "b"),
            "nested" to mapOf(
                "asset" to mapOf(
                    "id" to "some-nested-id",
                    "type" to "simple",
                    "metaData" to mapOf<String, Any>("a" to "b"),
                ),
            ),
            "nestedAssets" to listOf(
                mapOf(
                    "asset" to mapOf(
                        "id" to "some-nested-id",
                        "type" to "simple",
                        "metaData" to mapOf<String, Any>("a" to "b"),
                    ),
                ),
            ),
        )
        val sampleAsset: Asset = J2V8.create().serialize(sampleMap) as Asset
        val sampleJson = Json.encodeToJsonElement(GenericSerializer(), sampleMap)
        val sampleFlow = makeFlow(sampleJson)

        var dummy: RenderableAsset? = null
        var dummy2: List<RenderableAsset?>? = null
    }
}
