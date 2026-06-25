package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.AnyAsset
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable
import androidx.compose.foundation.layout.Row as ComposeRow

/** Horizontal layout container — children are arranged left-to-right. */
public class Row(
    assetContext: AssetContext,
) : ComposableAsset<Row.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        val children: List<AnyAsset> = emptyList(),
        val justify: String? = null,
        val align: String? = null,
    )

    @Composable
    override fun content(data: Data) {
        ComposeRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = when (data.justify) {
                "center" -> Arrangement.Center
                "end" -> Arrangement.End
                "spaceBetween" -> Arrangement.SpaceBetween
                "spaceAround" -> Arrangement.SpaceAround
                "spaceEvenly" -> Arrangement.SpaceEvenly
                else -> Arrangement.spacedBy(8.dp)
            },
            verticalAlignment = when (data.align) {
                "center" -> Alignment.CenterVertically
                "end" -> Alignment.Bottom
                else -> Alignment.Top
            },
        ) {
            data.children.forEach { it.compose() }
        }
    }
}
