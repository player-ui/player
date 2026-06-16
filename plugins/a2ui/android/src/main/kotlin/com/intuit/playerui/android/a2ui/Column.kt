package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column as ComposeColumn
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable

/** Vertical layout container — children are arranged top-to-bottom. */
public class Column(
    assetContext: AssetContext,
) : ComposableAsset<Column.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        val children: List<RenderableAsset> = emptyList(),
        val justify: String? = null,
        val align: String? = null,
    )

    @Composable
    override fun content(data: Data) {
        ComposeColumn(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = when (data.justify) {
                "center" -> Arrangement.Center
                "end" -> Arrangement.Bottom
                "spaceBetween" -> Arrangement.SpaceBetween
                "spaceAround" -> Arrangement.SpaceAround
                "spaceEvenly" -> Arrangement.SpaceEvenly
                else -> Arrangement.spacedBy(8.dp)
            },
            horizontalAlignment = when (data.align) {
                "center" -> Alignment.CenterHorizontally
                "end" -> Alignment.End
                else -> Alignment.Start
            },
        ) {
            data.children.forEach { it.compose(modifier = Modifier.fillMaxWidth()) }
        }
    }
}
