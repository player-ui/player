package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.Serializable

/** A2UI `List` — renders children stacked vertically or horizontally with spacing. */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UIList(
    assetContext: AssetContext,
) : ComposableAsset<A2UIList.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val children: List<RenderableAsset> = emptyList(),
        val direction: String? = null,
        val align: String? = null,
        override val accessibility: String? = null,
        override val weight: Double? = null,
    ) : A2UICommon

    @Composable
    override fun content(data: Data) {
        if (data.direction == "horizontal") {
            Row(
                modifier = Modifier.fillMaxWidth().a2uiCommon(data),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Layout.verticalAlignment(data.align),
            ) {
                data.children.forEach { it.compose() }
            }
        } else {
            Column(
                modifier = Modifier.fillMaxWidth().a2uiCommon(data),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                horizontalAlignment = Layout.horizontalAlignment(data.align),
            ) {
                data.children.forEach { it.compose() }
            }
        }
    }
}
