package com.intuit.player.android.reference.assets.collection

import android.view.View
import android.widget.LinearLayout
import android.widget.LinearLayout.VERTICAL
import com.intuit.player.android.AssetContext
import com.intuit.player.android.asset.DecodableAsset
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.android.extensions.into
import kotlinx.serialization.Serializable

/** Asset that renders a group of assets as children with little semantic meaning */
open class Collection(assetContext: AssetContext) : DecodableAsset<Collection.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Data(
        /** Required [values] is the collection of asset */
        val values: List<RenderableAsset>
    )

    override fun initView(): View = LinearLayout(context).apply {
        orientation = VERTICAL
    }

    override fun View.hydrate() {
        require(this is LinearLayout)

        data.values.map {
            it.render()
        } into this
    }
}
