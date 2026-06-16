package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text as ComposeText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable

/**
 * Display an image from a URL.
 *
 * Note: the Android player does not bundle a network image loader, so this renders a
 * labelled placeholder showing the source URL. Wire a loader (e.g. Coil `AsyncImage`)
 * to render the actual bitmap.
 */
public class Image(
    assetContext: AssetContext,
) : ComposableAsset<Image.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        val url: String? = null,
        val fit: String? = null,
        val variant: String? = null,
        val accessibility: String? = null,
    )

    @Composable
    override fun content(data: Data) {
        Box(
            modifier = Modifier
                .heightIn(min = 80.dp)
                .border(1.dp, MaterialTheme.colors.onSurface.copy(alpha = 0.2f))
                .padding(8.dp),
            contentAlignment = Alignment.Center,
        ) {
            ComposeText(text = data.accessibility ?: data.url.orEmpty())
        }
    }
}
