package com.intuit.playerui.android.compose

import androidx.compose.ui.text.TextStyle
import com.intuit.playerui.android.extensions.Style

public interface AssetStyle {
    public val textStyle: TextStyle?
    public val xmlStyles: List<Style>?
}
