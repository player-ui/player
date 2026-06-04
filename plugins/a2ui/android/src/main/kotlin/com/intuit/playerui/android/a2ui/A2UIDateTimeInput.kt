package com.intuit.playerui.android.a2ui

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
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

/**
 * A2UI `DateTimeInput` — a date/time entry bound to the data model as an ISO
 * string. Rendered as a text input with a label hinting the enabled portions;
 * `enableDate`/`enableTime` describe which parts the value carries.
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
        var text by remember(data.currentValue) { mutableStateOf(data.currentValue) }

        val label = when {
            data.enableDate && data.enableTime -> "Date & time"
            data.enableTime -> "Time"
            else -> "Date"
        }

        OutlinedTextField(
            value = text,
            onValueChange = { newValue ->
                text = newValue
                scope.launch { data.set(newValue) }
            },
            label = { Text(label) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().a2uiCommon(data),
        )
    }
}
