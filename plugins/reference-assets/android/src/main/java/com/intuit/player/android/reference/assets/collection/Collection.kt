package com.intuit.player.android.reference.assets.collection

import android.view.LayoutInflater
import android.view.View
import com.intuit.player.android.AssetContext
import com.intuit.player.android.asset.DecodableAsset
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.android.extensions.into
import com.intuit.player.android.reference.assets.R
import com.intuit.player.android.reference.assets.text.Text
import kotlinx.serialization.Serializable

/** Asset that renders a group of assets as children with little semantic meaning */
open class Collection(assetContext: AssetContext) : DecodableAsset<Collection.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Data(
        /** Required [values] is the collection of asset */
        val values: List<RenderableAsset>,
        /** An optional label to title the collection */
        val label: RenderableAsset? = null
    )

    override fun initView() = LayoutInflater.from(context).inflate(R.layout.collection, null).rootView

    override fun View.hydrate() {
        data.label?.render(Text.Styles.Label) into findViewById(R.id.collection_label)

        data.values.map {
            it.render()
        } into findViewById(R.id.collection_values)
    }
}
