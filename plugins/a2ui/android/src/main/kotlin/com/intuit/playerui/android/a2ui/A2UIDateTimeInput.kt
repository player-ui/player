package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.OutlinedTextField
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

/**
 * A2UI `DateTimeInput` — a date/time entry bound to the data model as an ISO
 * string. Mirrors React's native `<input type="date|time|datetime-local">`:
 * tapping the (read-only) field opens the native picker(s) selected by
 * `enableDate`/`enableTime`, emitting an ISO value.
 */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UIDateTimeInput(
    assetContext: AssetContext,
) : ComposableAsset<A2UIDateTimeInput.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val currentValue: String = "",
        val enableDate: Boolean = true,
        val enableTime: Boolean = false,
        override val accessibility: String? = null,
        override val weight: Double? = null,
        private val set: (String) -> Unit = {},
    ) : A2UICommon {
        suspend fun set(value: String) = withContext(Dispatchers.Default) { set.invoke(value) }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        val context = LocalContext.current
        var text by remember(data.currentValue) { mutableStateOf(data.currentValue) }

        val label = when {
            data.enableDate && data.enableTime -> "Date & time"
            data.enableTime -> "Time"
            else -> "Date"
        }

        val commit: (String) -> Unit = { value ->
            text = value
            scope.launch { data.set(value) }
        }

        // Compose the enabled portions. When both are enabled, the date picker
        // chains into the time picker and the parts are joined as `<date>T<time>`.
        val openPicker: () -> Unit = {
            when {
                data.enableDate && data.enableTime -> DateTimePickers.showDatePicker(context, text) { date ->
                    DateTimePickers.showTimePicker(context, text) { time -> commit("${date}T$time") }
                }
                data.enableTime -> DateTimePickers.showTimePicker(context, text, commit)
                else -> DateTimePickers.showDatePicker(context, text, commit)
            }
        }

        Box(modifier = Modifier.fillMaxWidth().a2uiCommon(data)) {
            OutlinedTextField(
                value = text,
                onValueChange = {},
                readOnly = true,
                enabled = false,
                label = { Text(label) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            // Transparent overlay captures the tap (a disabled field won't).
            Box(modifier = Modifier.matchParentSize().clickable { openPicker() })
        }
    }
}
