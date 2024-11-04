package com.intuit.playerui.android.reference.assets.badge

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable

internal class Badge(
    assetContext: AssetContext,
) : ComposableAsset<Badge.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Data(
        val label: String? = null,
        val status: String? = null,
    )

    @Composable
    override fun content(data: Data) {
        val label = data.label ?: ""
        Row(
            modifier =
            Modifier
                .height(24.dp)
                .wrapContentSize()
                .clip(RoundedCornerShape(4.dp))
                .background(color = if (data.status == "info") Color.Blue else Color.Red)
                .padding(
                    start = 4.dp,
                    top = 2.dp,
                    end = 4.dp,
                    bottom = 4.dp,
                ),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (label.isNotEmpty()) {
                Text(
                    text = label,
                    color = Color.White,
                )
            }
        }
    }
}
