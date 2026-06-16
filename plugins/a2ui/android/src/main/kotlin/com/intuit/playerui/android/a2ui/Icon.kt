package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.border
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text as ComposeText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable

/**
 * Display an icon by [Data.name].
 *
 * Note: only `material-icons-core` (a small set) is available to the Android player, so
 * this renders the icon name in a circular chip as a portable placeholder. Wire
 * `material-icons-extended` (or an icon font) to render the actual glyph.
 */
public class Icon(
    assetContext: AssetContext,
) : ComposableAsset<Icon.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        val name: String? = null,
        val accessibility: String? = null,
    )

    @Composable
    override fun content(data: Data) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .border(1.dp, MaterialTheme.colors.onSurface.copy(alpha = 0.2f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            ComposeText(
                text = data.name?.take(2)?.uppercase().orEmpty(),
                style = MaterialTheme.typography.caption,
                textAlign = TextAlign.Center,
            )
        }
    }
}
