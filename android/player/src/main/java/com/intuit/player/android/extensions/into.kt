package com.intuit.player.android.extensions

import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.core.view.children
import androidx.transition.Transition
import androidx.transition.TransitionManager

/**
 * Helper method to replace the existing [FrameLayout] child
 * with a specific [View]. It will hide the [root] if the
 * receiver is null.
 *
 * @receiver [View] to inject
 * @param root [FrameLayout] to be injected to
 */
public infix fun View?.into(root: FrameLayout) {
    val existing = root.getChildAt(0)
    if (this != existing) {
        root.removeView(existing)
    }
    this into root as ViewGroup
}

/**
 * Helper method to replace the existing [FrameLayout] child
 * with a specific [View] with the option to provide a [Transition].
 * It will hide the [root] if the receiver is null.
 *
 * @receiver [View] to inject
 * @param root [FrameLayout] to be injected to
 * @param transition [Transition] to take effect if given
 */

public fun View?.transitionInto(root: FrameLayout, transition: Transition?) {
    root.removeAllViews()
    if (this == null) {
        root.visibility = View.GONE
    } else {
        root.visibility = View.VISIBLE
        if (!root.children.contains(this)) {
            removeSelf()
            TransitionManager.beginDelayedTransition(root, transition)
            root.addView(this)
        }
    }
}

/**
 * Helper method to inject a nullable [View] into a [ViewGroup]
 * if not already added to the [root]. It will hide the [root]
 * if the receiver is null.
 *
 * @receiver [View] to inject
 * @param root [ViewGroup] to be injected to
 */
public infix fun View?.into(root: ViewGroup) {
    if (this == null) {
        root.visibility = View.GONE
        root.removeAllViews()
    } else {
        root.visibility = View.VISIBLE
        if (!root.children.contains(this)) {
            removeSelf()
            root.addView(this)
        }
    }
}

/**
 * Helper method to replace the existing [ViewGroup.children]
 * with the collection of [View]s.
 *
 * @receiver Collection of [View]s to inject
 * @param root [ViewGroup] to be injected to
 */
public infix fun List<View?>.into(root: ViewGroup) {
    val filtered = filterNotNull()
    if (filtered.isEmpty()) {
        root.visibility = View.GONE
        root.removeAllViews()
    } else {
        root.visibility = View.VISIBLE

        // For each of the non-null views
        filtered.forEachIndexed { index, new ->
            val old = root.getChildAt(index)
            // Only need to change if not equal
            if (new != old) {
                // Only remove if not contained in updated collection
                if (old != null && !contains(old)) root.removeView(old)

                // Ensure it doesn't already have a parent and inject view
                new.removeSelf()
                root.addView(new, index)
            }
        }

        // Remove any leftover views
        while (root.childCount > filtered.size) { root.removeViewAt(root.childCount - 1) }
    }
}
