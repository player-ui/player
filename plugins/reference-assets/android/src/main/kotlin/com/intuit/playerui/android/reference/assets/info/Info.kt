package com.intuit.playerui.android.reference.assets.info

import android.view.LayoutInflater
import android.view.View
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.GenericAsset
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.extensions.into
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.text.Text
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
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

    override suspend fun View.hydrate(data: Data) = coroutineScope {
        val title = async { data.title?.render(Text.Styles.Title) }
        val primary = async { data.primaryInfo?.render() }
        val actions = async { data.actions.filterNotNull().map { it.render() } }
        val footer = async { data.footer?.render() }
        title.await() into findViewById(R.id.info_title)
        primary.await() into findViewById(R.id.info_primary_info)
        actions.await() into findViewById(R.id.info_actions)
        footer.await() into findViewById(R.id.info_footer)
    }
}
