package com.intuit.playerui.android.extensions

import android.view.View
import android.view.ViewManager

/** Remove [this] [View] from its parent, if it has one */
internal fun View?.removeSelf() = (this?.parent as? ViewManager)
    ?.removeView(this)
