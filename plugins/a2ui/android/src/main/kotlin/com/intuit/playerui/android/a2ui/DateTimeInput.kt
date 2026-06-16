package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.OutlinedTextField
import androidx.compose.material.Text as ComposeText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

/**
 * Date/time entry bound to the data model.
 *
 * Note: this renders a free-form text field for the ISO value rather than a native
 * picker, to avoid pulling in a date-picker dependency. The bound value round-trips
 * through the data model identically.
 */
public class DateTimeInput(
    assetContext: AssetContext,
) : ComposableAsset<DateTimeInput.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        val currentValue: String = "",
        val enableDate: Boolean = true,
        val enableTime: Boolean = false,
        private val set: (String?) -> Unit,
    ) {
        suspend fun set(newValue: String?): Unit = withContext(Dispatchers.Default) { set.invoke(newValue) }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        val label = when {
            data.enableDate && data.enableTime -> "Date & time"
            data.enableTime -> "Time"
            else -> "Date"
        }
        OutlinedTextField(
            value = data.currentValue,
            onValueChange = { next -> scope.launch { data.set(next) } },
            label = { ComposeText(label) },
            modifier = Modifier.fillMaxWidth().testTag("DateTimeInput"),
        )
    }
}
