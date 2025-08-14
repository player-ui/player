package com.intuit.playerui.android.reference.assets.input

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import android.util.AttributeSet
import androidx.appcompat.widget.AppCompatEditText
import androidx.core.widget.addTextChangedListener

class FormattedEditText : AppCompatEditText {

    constructor(context: Context) : super(context)
    constructor(context: Context, attrs: AttributeSet?) : super(context, attrs)
    constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(context, attrs, defStyleAttr)

    /** Reference to formatter specific [TextWatcher] to allow for removal w/o reference */
    private var formatter: TextWatcher? = null

    /** Register new formatter specific [TextWatcher] to replace to old */
    fun registerFormatter(formatter: (Editable?) -> Unit) {
        removeFormatter()
        this.formatter = addTextChangedListener(afterTextChanged = formatter)
    }

    /** Remove formatter specific [TextWatcher] */
    fun removeFormatter() {
        removeTextChangedListener(formatter)
        formatter = null
    }

    /** Convenience method to allow for changes to be made without triggering the [formatter] */
    fun pauseFormatter(block: () -> Unit) {
        formatter?.let(::removeTextChangedListener)
        block()
        formatter?.let(::addTextChangedListener)
    }
}
