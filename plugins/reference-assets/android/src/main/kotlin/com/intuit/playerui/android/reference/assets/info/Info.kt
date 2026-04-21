package com.intuit.playerui.android.reference.assets.info

import android.view.LayoutInflater
import android.view.View
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.GenericAsset
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.text.Text
import kotlinx.serialization.Serializable

class Info(
    assetContext: AssetContext,
) : RenderableAsset<Info.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val title: GenericAsset? = null,
        val primaryInfo: GenericAsset? = null,
        val actions: List<GenericAsset?> = emptyList(),
        val footer: GenericAsset? = null,
    )

    override suspend fun initView(data: Data) = LayoutInflater.from(context).inflate(R.layout.info, null).rootView

    override suspend fun View.hydrate(data: Data) {
        data.title?.renderInto(findViewById(R.id.info_title), Text.Styles.Title)
        data.primaryInfo?.renderInto(findViewById(R.id.info_primary_info))
        data.actions.filterNotNull().forEach { it.renderInto(findViewById(R.id.info_actions)) }
        data.footer?.renderInto(findViewById(R.id.info_footer))
    }
}
