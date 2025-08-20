package com.intuit.playerui.android.reference.assets

import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.intuit.playerui.android.compose.AssetStyle
import com.intuit.playerui.android.extensions.Style

data class ParsedAssetStyle(
    override val textStyle: TextStyle,
    override val xmlStyles: List<Style>,
) : AssetStyle

class XmlAssetStyleParser(
    private val context: Context,
) {
    fun parse(xmlResourceId: Int): AssetStyle {
        val typedArray = context.obtainStyledAttributes(
            xmlResourceId,
            intArrayOf(
                // Add the styleable attributes here
                android.R.attr.textSize,
                android.R.attr.textStyle,
                android.R.attr.textColor,
            ),
        )

        // Extract values from TypedArray
        val textSize = typedArray.getDimensionPixelSize(0, 0).toFloat() // Default is 0
        val textStyle = typedArray.getInt(1, 0) // 0 for normal, 1 for bold, etc.
        val textColor = typedArray.getColor(2, 0) // Default is 0 (black)

        typedArray.recycle()

        // Convert to Compose TextStyle
        val fontWeight = when (textStyle) {
            1 -> FontWeight.Bold // bold
            else -> FontWeight.Normal // normal
        }

        val textStyleCompose = TextStyle(
            fontSize = textSize.sp,
            fontWeight = fontWeight,
            color = Color(textColor),
            // Add other properties as needed
        )

        // Return the AssetStyle with parsed values
        return ParsedAssetStyle(
            textStyle = textStyleCompose,
            xmlStyles = listOf(xmlResourceId), // You can include more styles if needed
        )
    }
}
