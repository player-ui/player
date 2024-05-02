package com.intuit.playerui.android.reference.assets.text

import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable

internal class TextCompose(assetContext: AssetContext) :
    ComposableAsset<TextCompose.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Data(
        val value: String,
    )

    @Composable
    override fun content(data: Data) {
        Text(
            text = data.value,
            Modifier.testTag("text-composable"),
        )
    }
}
