package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Tab
import androidx.compose.material.TabRow
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.Serializable

/** A2UI `Tabs` — a tab strip; the selected tab's child is rendered below. */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UITabs(
    assetContext: AssetContext,
) : ComposableAsset<A2UITabs.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class TabItem(
        val title: String = "",
        val child: RenderableAsset? = null,
    )

    @Serializable
    data class Data(
        val tabItems: List<TabItem> = emptyList(),
        override val accessibility: String? = null,
        override val weight: Double? = null,
    ) : A2UICommon

    @Composable
    override fun content(data: Data) {
        if (data.tabItems.isEmpty()) return
        var selected by remember { mutableStateOf(0) }
        val index = selected.coerceIn(0, data.tabItems.lastIndex)

        Column(modifier = Modifier.fillMaxWidth().a2uiCommon(data)) {
            TabRow(selectedTabIndex = index) {
                data.tabItems.forEachIndexed { i, item ->
                    Tab(
                        selected = i == index,
                        onClick = { selected = i },
                        text = { Text(item.title) },
                    )
                }
            }
            data.tabItems[index].child?.compose(modifier = Modifier.padding(top = 8.dp))
        }
    }
}
