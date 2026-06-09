package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.Checkbox
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

/** A2UI `CheckBox` — a boolean toggle bound to the data model with an optional label. */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UICheckBox(
    assetContext: AssetContext,
) : ComposableAsset<A2UICheckBox.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val label: String? = null,
        val currentValue: Boolean = false,
        override val accessibility: String? = null,
        override val weight: Double? = null,
        private val set: (Boolean) -> Unit = {},
    ) : A2UICommon {
        suspend fun set(value: Boolean) = withContext(Dispatchers.Default) { set.invoke(value) }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        Row(
            modifier = Modifier.fillMaxWidth().a2uiCommon(data),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Checkbox(
                checked = data.currentValue,
                onCheckedChange = { checked -> scope.launch { data.set(checked) } },
            )
            data.label?.let { Text(it) }
        }
    }
}
