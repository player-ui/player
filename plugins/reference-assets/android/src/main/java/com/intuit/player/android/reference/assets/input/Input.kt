package com.intuit.player.android.reference.assets.input

import android.view.LayoutInflater
import android.view.View
import android.view.inputmethod.EditorInfo
import com.intuit.player.android.AssetContext
import com.intuit.player.android.asset.DecodableAsset
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.android.extensions.into
import com.intuit.player.android.reference.assets.R
import com.intuit.player.android.reference.assets.text.Text
import com.intuit.player.plugins.transactions.commitPendingTransaction
import com.intuit.player.plugins.transactions.registerPendingTransaction
import kotlinx.serialization.Serializable

class Input(assetContext: AssetContext) : DecodableAsset<Input.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Validation(
        val message: String
    )

    @Serializable
    data class Data(
        val set: (String?) -> Unit,
        val format: (String?) -> String?,

        /** Optional [label] that gives some semantic meaning to the field asset */
        val label: RenderableAsset? = null,

        /** The current value of the input from the data-model */
        val value: String? = null,

        val validation: Validation? = null,
    )

    override fun initView(): View = LayoutInflater.from(context).inflate(R.layout.input, null).apply {
        findViewById<FormattedEditText>(R.id.input_field).run {
            setOnEditorActionListener { _, actionId, _ ->
                if (actionId == EditorInfo.IME_ACTION_DONE) {
                    clearFocus()
                }
                false
            }
        }
    }.rootView

    override fun View.hydrate() {
        data.label?.render(Text.Styles.Label) into findViewById(R.id.input_label_container)

        findViewById<FormattedEditText>(R.id.input_field).run {
            error = data.validation?.message
            val (value, isMasked) = data.value.maybePrivify()
            if (value != text.toString()) {
                setText(value ?: "")
                setSelection(value?.length ?: 0)
            }

            registerFormatter {
                it ?: return@registerFormatter

                // Ignore input when masked
                if (isMasked) {
                    pauseFormatter {
                        it.clear()
                        it.replace(0, it.length, data.value.maybePrivify().first)
                    }

                    return@registerFormatter
                }

                val value = it.toString()

                val formatted = data.format(value) ?: value
                val shouldFormat = (selectionStart == selectionEnd) and (selectionEnd == it.length)

                if (value != formatted && shouldFormat) pauseFormatter {
                    it.clear()
                    it.replace(0, it.length, formatted.maybePrivify().first)
                }
            }

            setOnFocusChangeListener { _, hasFocus ->
                if (!hasFocus) {
                    player.commitPendingTransaction()
                } else {
                    player.registerPendingTransaction {
                        // only set data when we have valid data to set
                        if (!isMasked) data.set(text.toString())
                        else rehydrate()
                    }
                }
            }

            // need to refresh registered pending transaction if we have focus
            if (hasFocus()) onFocusChangeListener.onFocusChange(this, true)
        }
    }

    /** Helper to conditionally mask sensitive data under the right conditions */
    private fun String?.maybePrivify(): Pair<String?, Boolean> =
        /*if (shouldMaskData) this?.privify() to true
        else */this to false
}
