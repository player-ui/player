package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Card as ComposeCard
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable

/** Container with elevation/border and padding. */
public class Card(
    assetContext: AssetContext,
) : ComposableAsset<Card.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        val child: RenderableAsset? = null,
    )

    @Composable
    override fun content(data: Data) {
        ComposeCard(modifier = Modifier.fillMaxWidth(), elevation = 2.dp) {
            data.child?.compose(modifier = Modifier.fillMaxWidth().padding(16.dp))
        }
    }
}
