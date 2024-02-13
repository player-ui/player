package com.intuit.playerui.android.reference.assets.info

import android.view.LayoutInflater
import android.view.View
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.asset.SuspendableAsset
import com.intuit.playerui.android.extensions.into
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.text.Text
import kotlinx.serialization.Serializable

class Info(assetContext: AssetContext) : SuspendableAsset<Info.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Data(
        val title: RenderableAsset? = null,
        val primaryInfo: RenderableAsset? = null,
        val actions: List<RenderableAsset?> = emptyList(),
    )

    override suspend fun initView(data: Data) = LayoutInflater.from(context).inflate(R.layout.info, null).rootView

    override suspend fun View.hydrate(data: Data) {
        data.title?.render(Text.Styles.Title) into findViewById(R.id.info_title)
        data.primaryInfo?.render() into findViewById(R.id.info_primary_info)
        data.actions.filterNotNull().map {
            it.render()
        } into findViewById(R.id.info_actions)
    }
}
