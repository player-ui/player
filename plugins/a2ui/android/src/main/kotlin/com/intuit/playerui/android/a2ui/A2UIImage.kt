package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.Icon
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.Serializable

/**
 * A2UI `Image` — renders a placeholder for the image at `url`. Network image
 * loading requires an image-loading dependency (e.g. Coil), which is not yet on
 * the classpath; this renders a sized placeholder carrying the URL as its
 * content description so layout and accessibility are preserved.
 */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UIImage(
    assetContext: AssetContext,
) : ComposableAsset<A2UIImage.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val url: String? = null,
        val fit: String? = null,
        val variant: String? = null,
        override val accessibility: String? = null,
        override val weight: Double? = null,
    ) : A2UICommon

    @Composable
    override fun content(data: Data) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .semantics { contentDescription = data.accessibility ?: data.url ?: "image" },
            contentAlignment = Alignment.Center,
        ) {
            Icon(imageVector = Icons.Filled.Person, contentDescription = null)
        }
    }
}
