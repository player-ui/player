package com.intuit.playerui.android.a2ui

import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

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
