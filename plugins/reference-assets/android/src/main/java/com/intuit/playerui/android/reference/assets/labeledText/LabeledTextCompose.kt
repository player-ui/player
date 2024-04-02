package com.intuit.playerui.android.reference.assets.labeledText

import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.runtime.Composable
import androidx.compose.material.ListItem
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp

import com.intuit.playerui.android.asset.ComposableAsset
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.asset.Style
import com.intuit.playerui.android.asset.compose
import com.intuit.playerui.android.reference.assets.text.Text
import kotlinx.serialization.Serializable

internal class LabeledTextCompose(assetContext: AssetContext) :
    ComposableAsset<LabeledTextCompose.Data>(assetContext,Data.serializer()) {

    @Serializable
    data class Data(
        val label: RenderableAsset,
        val value: RenderableAsset,
    )

    @OptIn(ExperimentalMaterialApi::class)
    @Composable
    override fun content(data: Data) {
        ListItem(
            overlineText = {data.label?.compose(style = Style(
                xmlStyles = listOf(Text.Styles.Label),
                composeTextStyle = TextStyle(
                    fontSize = 16.sp,
                    fontWeight = FontWeight(500),
                    textAlign = TextAlign.Start
                )
            ))},

            secondaryText = {data.value.compose(
                style = Style(
                    xmlStyles = listOf(Text.Styles.Label),
                    composeTextStyle = TextStyle(
                        fontSize = 16.sp,
                        fontWeight = FontWeight(500),
                        textAlign = TextAlign.Start
                    )
                )
            )}) {}
    }
}
