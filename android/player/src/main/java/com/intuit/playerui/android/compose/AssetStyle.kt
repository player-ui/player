package com.intuit.playerui.android.compose

import androidx.compose.ui.text.TextStyle
import com.intuit.playerui.android.extensions.Style

interface AssetStyle {
    val textStyle: TextStyle?
    val xmlStyles: List<Style>?
}
