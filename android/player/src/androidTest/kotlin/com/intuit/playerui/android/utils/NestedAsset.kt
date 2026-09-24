package com.intuit.playerui.android.utils

import android.view.View
import android.widget.LinearLayout
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.AnyAsset
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.runtime.runtimeFactory
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.utils.makeFlow
import kotlinx.coroutines.CoroutineScope
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

internal class NestedAsset(
    assetContext: AssetContext,
) : RenderableAsset<NestedAsset.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val nested: AnyAsset? = null,
        val nestedAssets: List<AnyAsset> = emptyList(),
    )

    override suspend fun initView(data: Data) = LinearLayout(context)

    override fun CoroutineScope.hydrate(view: View, data: Data) {
        require(view is LinearLayout)
        inflate(data.nested, view)
        dummy = data.nested
        data.nestedAssets.forEach { inflate(it, view) }
        dummy2 = data.nestedAssets
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
        val sampleAsset: Asset = runtimeFactory.create().serialize(sampleMap) as Asset
        val sampleJson = Json.encodeToJsonElement(GenericSerializer(), sampleMap)
        val sampleFlow = makeFlow(sampleJson)

        var dummy: RenderableAsset<*>? = null
        var dummy2: List<RenderableAsset<*>?>? = null
    }
}
