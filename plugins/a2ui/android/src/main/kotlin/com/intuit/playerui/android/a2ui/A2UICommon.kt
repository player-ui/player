package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.intuit.playerui.android.asset.RenderableAsset

/**
 * Presentation hints shared by every A2UI asset, mirroring the core
 * `A2UICommon` interface (`plugins/a2ui/core/src/assets/common`). Each asset's
 * `@Serializable data class Data` implements this and declares its own
 * `accessibility`/`weight` properties (kotlinx serializes each class's declared
 * fields), so the deserialized shape matches the core asset types 1:1.
 *
 * - [accessibility]: screen-reader description (DOM `aria-label` in React,
 *   Compose `contentDescription` here).
 * - [weight]: flex-grow hint honored by flex containers (Row/Column/List).
 */
internal interface A2UICommon {
    val accessibility: String?
    val weight: Double?
}

/** Apply the shared [A2UICommon.accessibility] hint as a Compose semantics description. */
internal fun Modifier.a2uiCommon(common: A2UICommon): Modifier {
    val description = common.accessibility ?: return this
    return this.semantics { contentDescription = description }
}

/**
 * The flex-grow [A2UICommon.weight] declared on a child asset, read from its raw
 * node. A flex container reads this for each child (React applies `weight` on each
 * component itself via `commonProps`; on Android the parent applies it in-scope).
 */
internal val RenderableAsset.a2uiWeight: Double? get() = asset.node.getDouble("weight")

/**
 * Per-child layout modifier applied by a [RowScope] container (Row, horizontal
 * List). Mirrors React's `commonProps` flex handling: the child's [weight] maps to
 * `Modifier.weight` (flex-grow), and `align="stretch"` on the parent makes children
 * fill the cross axis (`fillMaxHeight` for a row).
 */
internal fun RowScope.childLayout(child: RenderableAsset, align: String?): Modifier {
    var modifier: Modifier = Modifier
    child.a2uiWeight?.let { if (it > 0) modifier = modifier.weight(it.toFloat()) }
    if (align == "stretch") modifier = modifier.fillMaxHeight()
    return modifier
}

/**
 * Per-child layout modifier applied by a [ColumnScope] container (Column, vertical
 * List). The child's [weight] maps to `Modifier.weight` (flex-grow), and
 * `align="stretch"` on the parent makes children fill the cross axis
 * (`fillMaxWidth` for a column).
 */
internal fun ColumnScope.childLayout(child: RenderableAsset, align: String?): Modifier {
    var modifier: Modifier = Modifier
    child.a2uiWeight?.let { if (it > 0) modifier = modifier.weight(it.toFloat()) }
    if (align == "stretch") modifier = modifier.fillMaxWidth()
    return modifier
}
