package com.intuit.playerui.android.a2ui

import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.Serializable

/**
 * A2UI `Text` — renders a string (already resolved from any model binding by the
 * core text transform) with a typography `variant`.
 */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UIText(
    assetContext: AssetContext,
) : ComposableAsset<A2UIText.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val text: String? = null,
        val variant: String? = null,
        override val accessibility: String? = null,
        override val weight: Double? = null,
    ) : A2UICommon

    @Composable
    override fun content(data: Data) {
        val typography = MaterialTheme.typography
        val style = when (data.variant) {
            "h1" -> typography.h1
            "h2" -> typography.h2
            "h3" -> typography.h3
            "h4" -> typography.h4
            "h5" -> typography.h5
            "caption" -> typography.caption
            else -> typography.body1
        }
        val fontWeight = when (data.variant) {
            "h1", "h2", "h3" -> FontWeight.Bold
            "h4", "h5" -> FontWeight.SemiBold
            else -> null
        }
        Text(
            text = data.text ?: "",
            style = style,
            fontWeight = fontWeight,
            modifier = Modifier.a2uiCommon(data),
        )
    }
}
