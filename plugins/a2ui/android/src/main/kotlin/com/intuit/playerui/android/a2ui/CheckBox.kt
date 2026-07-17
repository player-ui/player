package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.material.Checkbox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import androidx.compose.material.Text as ComposeText

/** Boolean toggle control bound to the data model. */
public class CheckBox(
    assetContext: AssetContext,
) : ComposableAsset<CheckBox.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        val label: String? = null,
        val currentValue: Boolean = false,
        private val set: (Boolean) -> Unit,
    ) {
        suspend fun set(newValue: Boolean): Unit = withContext(Dispatchers.Default) { set.invoke(newValue) }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.testTag("CheckBox"),
        ) {
            Checkbox(
                checked = data.currentValue,
                onCheckedChange = { next -> scope.launch { data.set(next) } },
            )
            data.label?.let { ComposeText(it) }
        }
    }
}
