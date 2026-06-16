package com.intuit.playerui.android.a2ui

import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text as ComposeText
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.TextStyle
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable

/** Display text content with styling guidance via [Data.variant]. */
public class Text(
    assetContext: AssetContext,
) : ComposableAsset<Text.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        /** The text to display. The transform resolves a model binding to its literal value. */
        val text: String? = null,
        val variant: String? = null,
    )

    @Composable
    override fun content(data: Data) {
        val typography = MaterialTheme.typography
        val style: TextStyle = when (data.variant) {
            "h1" -> typography.h3
            "h2" -> typography.h4
            "h3" -> typography.h5
            "h4" -> typography.h6
            "h5" -> typography.subtitle1
            "caption" -> typography.caption
            else -> typography.body1
        }
        ComposeText(text = data.text.orEmpty(), style = style)
    }
}
