package com.intuit.playerui.android.utils

import android.view.View
import android.widget.TextView
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.runtimeFactory
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.utils.makeFlow
import kotlinx.coroutines.CoroutineScope
import kotlinx.serialization.json.Json

@Suppress("DEPRECATION_ERROR")
internal class SimpleAsset(
    assetContext: AssetContext,
) : RenderableAsset<Node>(assetContext, Node.serializer()) {
    override suspend fun initView(data: Node) = TextView(context)

    override fun CoroutineScope.hydrate(view: View, data: Node) = Unit

    companion object {
        val sampleMap = mapOf(
            "id" to "simple-asset",
            "data" to "{{someBinding}}",
            "type" to "simple",
            "metaData" to mapOf<String, Any>("a" to "b"),
        )
        val runtime = runtimeFactory.create()
        val sampleAsset = runtime.serialize(sampleMap) as Asset
        val sampleJson = Json.encodeToJsonElement(GenericSerializer(), sampleMap)
        val sampleFlow = makeFlow(sampleJson)
    }
}
