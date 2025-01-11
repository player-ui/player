package com.intuit.playerui.android.compose

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnitType
import androidx.compose.ui.unit.sp
import com.intuit.playerui.android.extensions.Style


interface AssetStyle {
    val textStyle: TextStyle?
    val xmlStyles: List<Style>?
}
