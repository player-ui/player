package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.ui.Alignment

/**
 * Shared mappings from A2UI layout enums (`justify`/`align`) onto Compose
 * [Arrangement] and [Alignment] values. A2UI uses the same enum names for Row
 * and Column; the `justify` axis differs (horizontal for Row, vertical for
 * Column) so it has axis-specific helpers.
 */
internal object Layout {
    /** Maps an A2UI `justify` value to a Compose horizontal [Arrangement] (Row main axis). */
    fun horizontalArrangement(justify: String?): Arrangement.Horizontal = when (justify) {
        "center" -> Arrangement.Center
        "end" -> Arrangement.End
        "spaceBetween" -> Arrangement.SpaceBetween
        "spaceAround" -> Arrangement.SpaceAround
        "spaceEvenly" -> Arrangement.SpaceEvenly
        else -> Arrangement.Start
    }

    /** Maps an A2UI `justify` value to a Compose vertical [Arrangement] (Column main axis). */
    fun verticalArrangement(justify: String?): Arrangement.Vertical = when (justify) {
        "center" -> Arrangement.Center
        "end" -> Arrangement.Bottom
        "spaceBetween" -> Arrangement.SpaceBetween
        "spaceAround" -> Arrangement.SpaceAround
        "spaceEvenly" -> Arrangement.SpaceEvenly
        else -> Arrangement.Top
    }

    /** Maps an A2UI `align` value to a Compose vertical [Alignment] (Row cross axis). */
    fun verticalAlignment(align: String?): Alignment.Vertical = when (align) {
        "center" -> Alignment.CenterVertically
        "end" -> Alignment.Bottom
        else -> Alignment.Top
    }

    /** Maps an A2UI `align` value to a Compose horizontal [Alignment] (Column cross axis). */
    fun horizontalAlignment(align: String?): Alignment.Horizontal = when (align) {
        "center" -> Alignment.CenterHorizontally
        "end" -> Alignment.End
        else -> Alignment.Start
    }
}
