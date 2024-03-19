package com.intuit.playerui.android.extensions

import android.content.Context
import androidx.annotation.StyleRes
import androidx.appcompat.view.ContextThemeWrapper

/**
 * Style resources are represented as [Int]s. The [androidx.annotation.StyleRes]
 * should be used in addition to the [Style] type to signify style resources.
 */
public typealias Style = Int

/**
 * Collection of [Style]s is represented as an ordered [List] because the order
 * they are overlaid on the [Context] matters.
 */
public typealias Styles = List<Style>

private fun Style?.toStyles() = this?.let {
    listOf(it)
} ?: emptyList()

public fun Context.overlayStyles(
    @StyleRes vararg additionalStyles: Style,
    @StyleRes baseStyle: Style?,
): Context = overlayStyles(baseStyle.toStyles(), additionalStyles.toList())

public fun Context.overlayStyles(@StyleRes vararg additionalStyles: Style): Context =
    overlayStyles(additionalStyles = additionalStyles.toList())

/**
 * Helper method to overlay a collection of [Style]s onto the [Context]
 *
 * @receiver collection of styles to overlay
 * @param additionalStyles to overlay onto the [Context] last
 * @return new [Context]
 */
public fun Context.overlayStyles(
    @StyleRes baseStyles: Styles = emptyList(),
    @StyleRes additionalStyles: Styles = emptyList(),
): Context = (baseStyles + additionalStyles)
    .fold(this, ::ContextThemeWrapper)
