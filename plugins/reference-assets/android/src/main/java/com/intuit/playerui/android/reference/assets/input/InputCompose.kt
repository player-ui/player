package com.intuit.playerui.android.reference.assets.input

import androidx.compose.material.OutlinedTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.android.compose.compose
import kotlinx.serialization.Serializable

internal class InputCompose(assetContext: AssetContext) :
    ComposableAsset<InputCompose.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Data(
        val label: RenderableAsset? = null,
    )

    @Composable
    override fun content(data: Data) {
        var value by remember { mutableStateOf("") }

        OutlinedTextField(
            value = value,
            onValueChange = {
                value = it
            },
            label = { data.label?.compose() },
            modifier = Modifier.testTag("input-compose"),
        )
    }
}
