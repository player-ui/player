package com.intuit.playerui.android.ui

import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.widget.FrameLayout

/**
 * A [FrameLayout] that renders normally except that it paints its children only once [ready] is true.
 *
 * Asset children attach and hydrate into this container as their async renders finish — and, for
 * Compose assets, a [android.widget.FrameLayout] child must stay attached to a window to compose at
 * all. Suppressing *paint* (rather than detaching, going GONE, or toggling visibility) lets every
 * child attach, measure, lay out, and compose normally while nothing is shown, so the whole update
 * can be revealed at once when hydration completes — without the piecemeal pop-in of children
 * appearing as each finishes, and without the flicker / lost cursor+focus+scroll of a visibility
 * toggle. This mirrors the old `AsyncViewStub`, which no-op'd `draw`/`dispatchDraw` for the same
 * reason, but keeps measure/layout running so the reveal is instant.
 *
 * Gating only [dispatchDraw] (not an ancestor `OnPreDrawListener`) keeps the suppression local and
 * cheap: it never re-posts view-root traversals, so holding it across many frames doesn't spin the
 * main thread, and it doesn't depend on OS-version-specific pre-draw-cancel behavior.
 */
public class DeferredRevealFrameLayout @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0,
) : FrameLayout(context, attrs, defStyleAttr) {
    public var ready: Boolean = true
        set(value) {
            if (field == value) return
            field = value
            invalidate()
        }

    override fun dispatchDraw(canvas: Canvas) {
        if (!ready) return
        super.dispatchDraw(canvas)
    }
}
