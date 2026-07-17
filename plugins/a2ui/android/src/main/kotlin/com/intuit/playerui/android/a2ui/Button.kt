package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.OutlinedButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.AnyAsset
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import androidx.compose.material.Button as ComposeButton

/** Clickable element that triggers an action via the transform-attached [Data.run]. */
public class Button(
    assetContext: AssetContext,
) : ComposableAsset<Button.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        /** Component rendered inside the button (typically a Text). */
        val child: AnyAsset? = null,
        val variant: String? = null,
        /** Attached by the buttonTransform — fires `exp` then the `value` transition. */
        private val run: () -> Unit,
    ) {
        suspend fun run(): Unit = withContext(Dispatchers.Default) { run.invoke() }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        val onClick: () -> Unit = {
            beacon("clicked", "Button")
            scope.launch { data.run() }
        }
        val modifier = Modifier.fillMaxWidth().testTag("Button")
        if (data.variant == "outline" || data.variant == "ghost") {
            OutlinedButton(onClick = onClick, modifier = modifier) {
                data.child?.compose()
            }
        } else {
            ComposeButton(onClick = onClick, modifier = modifier) {
                data.child?.compose()
            }
        }
    }
}
