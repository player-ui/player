package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material.Checkbox
import androidx.compose.material.RadioButton
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

/**
 * A2UI `ChoicePicker` — single-select (radio) when `maxAllowedSelections` is 1
 * or omitted, otherwise multi-select (checkboxes). Selected values are stored as
 * a string list in the data model via the transform `currentValue`/`set` helpers.
 */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UIChoicePicker(
    assetContext: AssetContext,
) : ComposableAsset<A2UIChoicePicker.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Option(
        val label: String = "",
        val value: String = "",
    )

    @Serializable
    data class Data(
        val options: List<Option> = emptyList(),
        val maxAllowedSelections: Int? = null,
        val currentValue: List<String> = emptyList(),
        override val accessibility: String? = null,
        override val weight: Double? = null,
        private val set: (List<String>) -> Unit = {},
    ) : A2UICommon {
        suspend fun set(value: List<String>) = withContext(Dispatchers.Default) { set.invoke(value) }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        val multiSelect = (data.maxAllowedSelections ?: 1) > 1

        Column(
            // Mirror React's role="radiogroup"/"group" so assistive tech reads the
            // options as a single selection group.
            modifier = Modifier.fillMaxWidth().a2uiCommon(data).selectableGroup(),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            data.options.forEach { option ->
                val selected = data.currentValue.contains(option.value)
                val onSelect: () -> Unit = {
                    val next = if (multiSelect) {
                        if (selected) data.currentValue - option.value else data.currentValue + option.value
                    } else {
                        listOf(option.value)
                    }
                    scope.launch { data.set(next) }
                }
                Row(
                    modifier = Modifier.fillMaxWidth().selectable(
                        selected = selected,
                        onClick = onSelect,
                        role = if (multiSelect) Role.Checkbox else Role.RadioButton,
                    ),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    // null callbacks: the parent Row handles selection/role so the
                    // control isn't announced as a separate focusable target.
                    if (multiSelect) {
                        Checkbox(checked = selected, onCheckedChange = null)
                    } else {
                        RadioButton(selected = selected, onClick = null)
                    }
                    Text(option.label)
                }
            }
        }
    }
}
