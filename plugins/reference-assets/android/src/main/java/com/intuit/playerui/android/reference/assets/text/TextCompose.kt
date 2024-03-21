package com.intuit.playerui.android.reference.assets.text

import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.intuit.playerui.android.asset.ComposableAsset
import com.intuit.playerui.android.AssetContext
import kotlinx.serialization.Serializable

internal class TextComposeAsset(assetContext: AssetContext) :
    ComposableAsset<TextComposeAsset.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Data(
        val value: String
    )

    @Composable
    override fun content(data: Data) {
        Text(
            text = data.value,
            Modifier.testTag("text-composable")
        )
    }
}
