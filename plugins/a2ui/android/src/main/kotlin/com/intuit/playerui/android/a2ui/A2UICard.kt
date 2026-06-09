package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Card
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.Serializable

/** A2UI `Card` — a surface container wrapping a single child. */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UICard(
    assetContext: AssetContext,
) : ComposableAsset<A2UICard.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val child: RenderableAsset? = null,
        override val accessibility: String? = null,
        override val weight: Double? = null,
    ) : A2UICommon

    @Composable
    override fun content(data: Data) {
        Card(
            modifier = Modifier.fillMaxWidth().a2uiCommon(data),
            elevation = 2.dp,
        ) {
            data.child?.compose(modifier = Modifier.padding(16.dp))
        }
    }
}
