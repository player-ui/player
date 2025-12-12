package com.intuit.playerui.android.utils

import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.DecodableAsset
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.runtimeFactory
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.utils.makeFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

internal class ThrowingAsset(
    assetContext: AssetContext,
) : DecodableAsset<ThrowingAsset.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        var layout: Layout,
        var value: String,
    )

    @Serializable
    enum class Layout {
        Frame,
        Linear,
    }

    override fun initView() = when (data.layout) {
        Layout.Frame -> FrameLayout(requireContext())
        Layout.Linear -> LinearLayout(requireContext())
    }

    override fun View.hydrate() {
         throw Exception("Throwing during render")
    }

    companion object {
        val sampleMap = mapOf(
            "id" to "throwing-asset",
            "type" to "throwing",
            "layout" to "Frame",
        )

        fun Runtime<*>.asset(value: Any = "value"): Asset = serialize(sampleMap + mapOf("value" to value)) as Asset

        val runtime = runtimeFactory.create()
        val sampleAsset = runtime.serialize(sampleMap) as Asset

        val sampleJson = Json.Default.encodeToJsonElement(GenericSerializer(), sampleMap)
        val sampleFlow = makeFlow(sampleJson)
    }
}