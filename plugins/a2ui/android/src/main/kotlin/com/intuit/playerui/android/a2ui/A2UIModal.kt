package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.Serializable

/**
 * A2UI `Modal` — renders the `entryPointChild` inline; tapping it opens a
 * [Dialog] containing the `contentChild`. Dismissing the dialog (back/scrim)
 * closes it.
 */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UIModal(
    assetContext: AssetContext,
) : ComposableAsset<A2UIModal.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val entryPointChild: RenderableAsset? = null,
        val contentChild: RenderableAsset? = null,
        override val accessibility: String? = null,
        override val weight: Double? = null,
    ) : A2UICommon

    @Composable
    override fun content(data: Data) {
        var open by remember { mutableStateOf(false) }

        Box(modifier = Modifier.clickable { open = true }.a2uiCommon(data)) {
            data.entryPointChild?.compose()
        }

        if (open) {
            Dialog(onDismissRequest = { open = false }) {
                Surface(modifier = Modifier.fillMaxWidth()) {
                    data.contentChild?.compose(modifier = Modifier.padding(16.dp))
                }
            }
        }
    }
}
