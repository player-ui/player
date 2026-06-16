package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.height
import androidx.compose.material.Divider as ComposeDivider
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable

/** Visual separator line, horizontal (default) or vertical. */
public class Divider(
    assetContext: AssetContext,
) : ComposableAsset<Divider.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        val axis: String? = null,
    )

    @Composable
    override fun content(data: Data) {
        if (data.axis == "vertical") {
            ComposeDivider(modifier = Modifier.fillMaxHeight().width(1.dp))
        } else {
            ComposeDivider(modifier = Modifier.fillMaxWidth().height(1.dp))
        }
    }
}
