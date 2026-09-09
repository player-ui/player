package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Tab
import androidx.compose.material.TabRow
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable
import androidx.compose.material.Text as ComposeText

/** Tabbed interface organizing content into switchable panels. */
public class Tabs(
    assetContext: AssetContext,
) : ComposableAsset<Tabs.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class TabItem(
        val title: String,
        val child: RenderableAsset? = null,
    )

    @Serializable
    public data class Data(
        val tabItems: List<TabItem> = emptyList(),
    )

    @Composable
    override fun content(data: Data) {
        if (data.tabItems.isEmpty()) return
        var selected by remember { mutableStateOf(0) }
        val current = data.tabItems.getOrNull(selected) ?: data.tabItems.first()

        Column(modifier = Modifier.fillMaxWidth().testTag("Tabs")) {
            TabRow(selectedTabIndex = selected) {
                data.tabItems.forEachIndexed { index, item ->
                    Tab(
                        selected = selected == index,
                        onClick = { selected = index },
                        text = { ComposeText(item.title) },
                    )
                }
            }
            current.child?.compose(modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
        }
    }
}
