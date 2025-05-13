package com.intuit.playerui.android.reference.assets.input

import android.view.LayoutInflater
import android.view.View
import android.view.inputmethod.EditorInfo
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.DecodableAsset
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.extensions.into
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.text.Text
import com.intuit.playerui.plugins.transactions.commitPendingTransaction
import com.intuit.playerui.plugins.transactions.registerPendingTransaction
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

class Input(assetContext: AssetContext) : DecodableAsset<Input.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Validation(
        val message: String,
    )

    @Serializable
    data class Data(
        private val set: (String?) -> Unit,
        private val format: (String?) -> String?,

        /** Optional [label] that gives some semantic meaning to the field asset */
        val label: RenderableAsset? = null,

        val note: RenderableAsset? = null,

        /** The current value of the input from the data-model */
        val value: String? = null,

        val validation: Validation? = null,
    ) {
        suspend fun set(value: String) = withContext(Dispatchers.Default) {
            set.invoke(value)
        }

        suspend fun format(value: String): String? = withContext(Dispatchers.Default) {
            format.invoke(value)
        }
    }

    override suspend fun initView(data: Data): View = LayoutInflater.from(context).inflate(R.layout.input, null).apply {
        findViewById<FormattedEditText>(R.id.input_field).run {
            setOnEditorActionListener { _, actionId, _ ->
                if (actionId == EditorInfo.IME_ACTION_DONE) {
                    clearFocus()
                }
                false
            }
        }
    }.rootView

    override suspend fun View.hydrate(data: Data) {
        data.label?.render(Text.Styles.Label) into findViewById(R.id.input_label_container)

        findViewById<FormattedEditText>(R.id.input_field).run {
            error = data.validation?.message
            if (data.value != text.toString()) {
                setText(data.value ?: "")
                setSelection(data.value?.length ?: 0)
            }

            registerFormatter {
                it ?: return@registerFormatter

                val value = it.toString()

                val formatted = runBlocking { data.format(value) } ?: value
                val shouldFormat = (selectionStart == selectionEnd) and (selectionEnd == it.length)

                if (value != formatted && shouldFormat) {
                    pauseFormatter {
                        it.clear()
                        it.replace(0, it.length, formatted)
                    }
                }
            }

            setOnFocusChangeListener { _, hasFocus ->
                if (!hasFocus) {
                    player.commitPendingTransaction()
                } else {
                    player.registerPendingTransaction {
                        hydrationScope.launch {
                            data.set(text.toString())
                        }
                    }
                }
            }

            // need to refresh registered pending transaction if we have focus
            if (hasFocus()) onFocusChangeListener.onFocusChange(this, true)
        }

        data.note?.render(Text.Styles.Note) into findViewById(R.id.input_note_container)
    }
}
