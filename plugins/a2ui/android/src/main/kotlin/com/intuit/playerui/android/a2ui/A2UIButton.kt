package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.Button
import androidx.compose.material.OutlinedButton
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

/**
 * A2UI `Button` — renders its child (typically a Text) and, on click, fires the
 * transform-provided `run()` helper which evaluates any expression and triggers
 * the resolved transition.
 */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UIButton(
    assetContext: AssetContext,
) : ComposableAsset<A2UIButton.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val child: RenderableAsset? = null,
        val variant: String? = null,
        override val accessibility: String? = null,
        override val weight: Double? = null,
        private val run: () -> Unit = {},
    ) : A2UICommon {
        suspend fun run() = withContext(Dispatchers.Default) { run.invoke() }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        val onClick: () -> Unit = { scope.launch { data.run() } }
        val modifier = Modifier.fillMaxWidth().a2uiCommon(data)

        when (data.variant) {
            "outline" -> OutlinedButton(onClick = onClick, modifier = modifier) { data.child?.compose() }
            "ghost" -> TextButton(onClick = onClick, modifier = modifier) { data.child?.compose() }
            else -> Button(onClick = onClick, modifier = modifier) { data.child?.compose() }
        }
    }
}
