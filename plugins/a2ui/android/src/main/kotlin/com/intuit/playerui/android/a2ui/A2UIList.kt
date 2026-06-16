package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable
import androidx.compose.foundation.layout.Column as ComposeColumn
import androidx.compose.foundation.layout.Row as ComposeRow

/** Scrollable list of items. Supports a horizontal or vertical direction. */
public class A2UIList(
    assetContext: AssetContext,
) : ComposableAsset<A2UIList.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        val children: List<RenderableAsset> = emptyList(),
        val direction: String? = null,
    )

    @Composable
    override fun content(data: Data) {
        if (data.direction == "horizontal") {
            ComposeRow(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                data.children.forEach { it.compose() }
            }
        } else {
            ComposeColumn(
                modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                data.children.forEach { it.compose(modifier = Modifier.fillMaxWidth()) }
            }
        }
    }
}
