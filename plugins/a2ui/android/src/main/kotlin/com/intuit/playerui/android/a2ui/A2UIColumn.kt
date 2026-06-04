package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.Serializable

/** A2UI `Column` — lays children out vertically with `justify`/`align` arrangement. */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UIColumn(
    assetContext: AssetContext,
) : ComposableAsset<A2UIColumn.Data>(assetContext, Data.serializer()) {
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
        Column(
            modifier = Modifier.fillMaxWidth().a2uiCommon(data),
            verticalArrangement = Layout.verticalArrangement(data.justify),
            horizontalAlignment = Layout.horizontalAlignment(data.align),
        ) {
            data.children.forEach { it.compose() }
        }
    }
}
