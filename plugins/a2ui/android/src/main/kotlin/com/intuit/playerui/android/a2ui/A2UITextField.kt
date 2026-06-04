package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.OutlinedTextField
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

/**
 * A2UI `TextField` — a single-line/multi-line text input bound to the data model
 * through the transform-provided `currentValue`/`set` helpers. `textFieldType`
 * selects the keyboard and obscuring behavior; `validationRegexp` is applied
 * client-side to surface an inline error.
 */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UITextField(
    assetContext: AssetContext,
) : ComposableAsset<A2UITextField.Data>(assetContext, Data.serializer()) {
    /** Mirrors the core `ValidationResponse` consumed by `TransformedTextField`. */
    @Serializable
    data class Validation(
        val message: String? = null,
        val severity: String? = null,
    )

    @Serializable
    data class Data(
        val label: String? = null,
        val textFieldType: String? = null,
        val validationRegexp: String? = null,
        val currentValue: String? = null,
        /** Validation result for the bound model location (from the transform). */
        val validation: Validation? = null,
        /** Schema data type discovered for the binding, if any. */
        val dataType: String? = null,
        override val accessibility: String? = null,
        override val weight: Double? = null,
        private val set: (String?) -> Unit = {},
        private val format: (String?) -> String? = { it },
    ) : A2UICommon {
        suspend fun set(value: String?) = withContext(Dispatchers.Default) { set.invoke(value) }

        /** Format a value through any schema-attached formatters (from the transform). */
        suspend fun format(value: String?): String? = withContext(Dispatchers.Default) { format.invoke(value) }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        var text by remember(data.currentValue) { mutableStateOf(data.currentValue ?: "") }

        val regexError = data.validationRegexp
            ?.let { runCatching { Regex(it) }.getOrNull() }
            ?.let { regex -> text.isNotEmpty() && !regex.matches(text) }
            ?: false

        // Mirror React: prefer the transform-provided validation message, else
        // fall back to the client-side regex check.
        val error = data.validation?.message ?: if (regexError) "Invalid value" else null

        OutlinedTextField(
            value = text,
            onValueChange = { newValue ->
                text = newValue
                scope.launch { data.set(newValue) }
            },
            label = data.label?.let { { Text(it) } },
            singleLine = data.textFieldType != "longText",
            isError = error != null,
            visualTransformation = if (data.textFieldType == "obscured") {
                PasswordVisualTransformation()
            } else {
                androidx.compose.ui.text.input.VisualTransformation.None
            },
            keyboardOptions = KeyboardOptions(
                keyboardType = when (data.textFieldType) {
                    "number" -> KeyboardType.Number
                    "obscured" -> KeyboardType.Password
                    else -> KeyboardType.Text
                },
            ),
            modifier = Modifier.fillMaxWidth().a2uiCommon(data),
        )
    }
}
