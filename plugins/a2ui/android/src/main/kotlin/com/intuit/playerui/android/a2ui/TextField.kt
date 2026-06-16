package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.MaterialTheme
import androidx.compose.material.OutlinedTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import androidx.compose.material.Text as ComposeText

/** Text input field bound to the data model via the transform-attached value + setter. */
public class TextField(
    assetContext: AssetContext,
) : ComposableAsset<TextField.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Validation(
        val message: String? = null,
        val severity: String? = null,
    )

    @Serializable
    public data class Data(
        val label: String? = null,
        /** Current value pulled from the data model by the transform. */
        val currentValue: String? = null,
        val textFieldType: String? = null,
        val validation: Validation? = null,
        /** Commits a new value to the data model. */
        private val set: (String?) -> Unit,
    ) {
        suspend fun set(newValue: String?): Unit = withContext(Dispatchers.Default) { set.invoke(newValue) }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        val isError = data.validation?.message != null
        val visualTransformation: VisualTransformation =
            if (data.textFieldType == "obscured") PasswordVisualTransformation() else VisualTransformation.None
        val keyboardType = when (data.textFieldType) {
            "number" -> KeyboardType.Number
            else -> KeyboardType.Text
        }
        OutlinedTextField(
            value = data.currentValue.orEmpty(),
            onValueChange = { next -> scope.launch { data.set(next) } },
            modifier = Modifier.fillMaxWidth().testTag("TextField"),
            label = data.label?.let { { ComposeText(it) } },
            isError = isError,
            singleLine = data.textFieldType != "longText",
            visualTransformation = visualTransformation,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        )
        data.validation?.message?.let {
            ComposeText(text = it, color = MaterialTheme.colors.error, style = MaterialTheme.typography.caption)
        }
    }
}
