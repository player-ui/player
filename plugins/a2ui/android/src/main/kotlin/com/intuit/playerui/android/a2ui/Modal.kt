package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.AlertDialog
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.AnyAsset
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable
import androidx.compose.material.Text as ComposeText

/**
 * Overlay dialog. The [Data.entryPointChild] is rendered inline and, when tapped,
 * opens an [AlertDialog] presenting [Data.contentChild].
 */
public class Modal(
    assetContext: AssetContext,
) : ComposableAsset<Modal.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        val entryPointChild: AnyAsset? = null,
        val contentChild: AnyAsset? = null,
    )

    @Composable
    override fun content(data: Data) {
        var open by remember { mutableStateOf(false) }

        Box(
            modifier = Modifier
                .testTag("Modal")
                .clickable { open = true },
        ) {
            data.entryPointChild?.compose()
        }

        if (open) {
            AlertDialog(
                onDismissRequest = { open = false },
                text = { data.contentChild?.compose(modifier = Modifier.padding(top = 8.dp)) },
                confirmButton = {
                    TextButton(onClick = { open = false }) { ComposeText("Close") }
                },
            )
        }
    }
}
