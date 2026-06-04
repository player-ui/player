package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.Serializable

/** A2UI `Row` — lays children out horizontally with `justify`/`align` arrangement. */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UIRow(
    assetContext: AssetContext,
) : ComposableAsset<A2UIRow.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val children: List<RenderableAsset> = emptyList(),
        val justify: String? = null,
        val align: String? = null,
        override val accessibility: String? = null,
        override val weight: Double? = null,
    ) : A2UICommon

    @Composable
    override fun content(data: Data) {
        Row(
            modifier = Modifier.fillMaxWidth().a2uiCommon(data),
            horizontalArrangement = Layout.horizontalArrangement(data.justify),
            verticalAlignment = Layout.verticalAlignment(data.align),
        ) {
            data.children.forEach { it.compose() }
        }
    }
}
