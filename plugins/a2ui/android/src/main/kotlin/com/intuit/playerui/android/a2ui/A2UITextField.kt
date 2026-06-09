package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.MaterialTheme
import androidx.compose.material.OutlinedTextField
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.TextFieldValue
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.plugins.transactions.commitPendingTransaction
import com.intuit.playerui.plugins.transactions.registerPendingTransaction
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
        val context = LocalContext.current

        // Hold a TextFieldValue so the caret/selection survives recomposition
        // (mirrors the reference Input asset's setText + setSelection). Seeded from
        // the model value, but only resynced when the model differs from the local
        // edit — so an external model update doesn't reset the cursor mid-typing.
        var field by remember { mutableStateOf(TextFieldValue(data.currentValue ?: "")) }
        LaunchedEffect(data.currentValue) {
            val modelValue = data.currentValue ?: ""
            if (modelValue != field.text) {
                field = TextFieldValue(modelValue, TextRange(modelValue.length))
            }
        }

        val regexError = data.validationRegexp
            ?.let { runCatching { Regex(it) }.getOrNull() }
            ?.let { regex -> field.text.isNotEmpty() && !regex.matches(field.text) }
            ?: false

        // Mirror React: prefer the transform-provided validation message, else
        // fall back to the client-side regex check.
        val error = data.validation?.message ?: if (regexError) "Invalid value" else null

        // Local edit. Like the reference Input asset, apply the transform's
        // formatter in-place while the caret sits at the end (so reformatting
        // doesn't fight the cursor); the model write is deferred to blur.
        val onEdit: (TextFieldValue) -> Unit = { new ->
            field = new
            val atEnd = new.selection.collapsed && new.selection.end == new.text.length
            if (atEnd) {
                scope.launch {
                    val formatted = data.format(new.text) ?: new.text
                    if (formatted != new.text) {
                        field = TextFieldValue(formatted, TextRange(formatted.length))
                    }
                }
            }
        }

        // Commit on blur via the PendingTransactionPlugin, exactly like the
        // reference Input asset: register the set() on focus, commit on blur.
        // (These extensions are no-ops if the plugin isn't registered.)
        val focusModifier = Modifier.onFocusChanged { focusState ->
            if (focusState.isFocused) {
                player.registerPendingTransaction {
                    scope.launch { data.set(field.text) }
                }
            } else {
                player.commitPendingTransaction()
            }
        }

        Column(modifier = Modifier.fillMaxWidth().a2uiCommon(data)) {
            if (data.textFieldType == "date") {
                // Mirror React's `<input type="date">`: a read-only field that opens
                // a native picker, emitting an ISO date string. A picked date is a
                // discrete commit, so write straight through (no focus/blur cycle).
                Box {
                    OutlinedTextField(
                        value = field.text,
                        onValueChange = {},
                        readOnly = true,
                        enabled = false,
                        label = data.label?.let { { Text(it) } },
                        singleLine = true,
                        isError = error != null,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .clickable {
                                DateTimePickers.showDatePicker(context, field.text) { picked ->
                                    field = TextFieldValue(picked, TextRange(picked.length))
                                    scope.launch { data.set(picked) }
                                }
                            },
                    )
                }
            } else {
                OutlinedTextField(
                    value = field,
                    onValueChange = onEdit,
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
                    modifier = Modifier.fillMaxWidth().then(focusModifier),
                )
            }
            if (error != null) {
                Text(
                    text = error,
                    color = MaterialTheme.colors.error,
                    style = MaterialTheme.typography.caption,
                )
            }
        }
    }
}
