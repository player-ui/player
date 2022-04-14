package com.intuit.player.android.utils

import android.view.View
import android.widget.ImageView
import com.intuit.player.android.AssetContext
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.runtime.serialize
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.j2v8.bridge.runtime.J2V8
import com.intuit.player.jvm.utils.makeFlow
import kotlinx.serialization.json.Json

@Suppress("DEPRECATION_ERROR")
internal class OtherSimpleAsset(assetContext: AssetContext) : RenderableAsset(assetContext) {

    override fun initView() = ImageView(context)

    override fun View.hydrate() = Unit

    companion object {
        val sampleMap = mapOf(
            "id" to "some-id",
            "type" to "simple",
            "metaData" to mapOf("role" to "other")
        )
        val sampleAsset: Asset = J2V8.create().serialize(sampleMap) as Asset
        val sampleJson = Json.encodeToJsonElement(GenericSerializer(), sampleMap)
        val sampleFlow = makeFlow(sampleJson)
    }
}
