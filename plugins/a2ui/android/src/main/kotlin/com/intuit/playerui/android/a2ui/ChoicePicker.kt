package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.selection.selectable
import androidx.compose.material.Checkbox
import androidx.compose.material.RadioButton
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

/** Select one (radio) or more (checkbox) options, bound to the data model. */
public class ChoicePicker(
    assetContext: AssetContext,
) : ComposableAsset<ChoicePicker.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Option(
        val label: String,
        val value: String,
    )

    @Serializable
    public data class Data(
        val options: List<Option> = emptyList(),
        val currentValue: List<String> = emptyList(),
        val maxAllowedSelections: Int = 1,
        private val set: (List<String>) -> Unit,
    ) {
        suspend fun set(newValue: List<String>): Unit = withContext(Dispatchers.Default) { set.invoke(newValue) }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        val multi = data.maxAllowedSelections != 1

        fun toggle(value: String) {
            val next: List<String> = if (!multi) {
                listOf(value)
            } else if (data.currentValue.contains(value)) {
                data.currentValue.filterNot { it == value }
            } else {
                if (data.currentValue.size >= data.maxAllowedSelections) return
                data.currentValue + value
            }
            scope.launch { data.set(next) }
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.testTag("ChoicePicker"),
        ) {
            data.options.forEach { option ->
                val checked = data.currentValue.contains(option.value)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.selectable(selected = checked, onClick = { toggle(option.value) }),
                ) {
                    if (multi) {
                        Checkbox(checked = checked, onCheckedChange = { toggle(option.value) })
                    } else {
                        RadioButton(selected = checked, onClick = { toggle(option.value) })
                    }
                    ComposeText(option.label)
                }
            }
        }
    }
}
