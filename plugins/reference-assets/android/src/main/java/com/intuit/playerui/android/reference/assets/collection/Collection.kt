package com.intuit.playerui.android.reference.assets.collection

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.LocalTextStyle
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.AndroidViewAttributes
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.android.compose.compose
import com.intuit.playerui.android.reference.assets.R
import kotlinx.serialization.Serializable

/** Asset that renders a group of assets as children with little semantic meaning */
class Collection(assetContext: AssetContext) : ComposableAsset<Collection.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Data(
        /** Required [values] is the collection of asset */
        val values: List<RenderableAsset>,
        /** An optional label to title the collection */
        val label: RenderableAsset? = null,
    )

    @Composable
    override fun content(data: Data) {
        Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
            CompositionLocalProvider(LocalTextStyle provides TextStyle(fontSize = 16.sp)) {
                data.label?.compose(
                    androidViewAttributes = AndroidViewAttributes(
                        modifier = Modifier.padding(top = 10.dp).fillMaxWidth(),
                        styles = listOf(R.style.Text_Label),
                    ),
                )
            }
            Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                data.values.map {
                    it.compose(
                        androidViewAttributes = AndroidViewAttributes(
                            modifier = Modifier.fillMaxWidth(),
                        ),
                    )
                }
            }
        }
    }
}
