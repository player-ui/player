package com.intuit.player.android.utils

import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import com.eclipsesource.v8.debug.mirror.Frame
import com.intuit.player.android.AssetContext
import com.intuit.player.android.asset.DecodableAsset
import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.bridge.runtime.serialize
import com.intuit.player.jvm.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.player.jvm.j2v8.bridge.runtime.J2V8
import com.intuit.player.jvm.utils.makeFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

internal class BrokenAsset(assetContext: AssetContext) : DecodableAsset<BrokenAsset.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Data(
        var layout: Layout,
        val shouldFail: Boolean,
    )

    @Serializable
    enum class Layout {
        Frame, Linear
    }

    override fun initView() = when (data.layout) {
        Layout.Frame -> FrameLayout(requireContext())
        Layout.Linear -> LinearLayout(requireContext())
    }

    override fun View.hydrate() {
        if (data.shouldFail || (
                data.layout == Layout.Frame && this is LinearLayout
                ) || (
                data.layout == Layout.Linear && this is FrameLayout
                )
        ) {
            invalidateView()
        }
    }

    companion object {
        val sampleMap = mapOf(
            "id" to "broken-asset",
            "type" to "broken",
            "layout" to "Frame",
            "shouldFail" to false,
        )
        fun Runtime<*>.asset(layout: Layout = Layout.Frame, shouldFail: Boolean = false): Asset =
            serialize(sampleMap + mapOf("layout" to layout.toString(), "shouldFail" to shouldFail)) as Asset
        val runtime = J2V8.create()
        val sampleAsset = runtime.serialize(sampleMap) as Asset
        val sampleJson = Json.encodeToJsonElement(GenericSerializer(), sampleMap)
        val sampleFlow = makeFlow(sampleJson)
    }
}
