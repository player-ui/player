package com.intuit.playerui.android.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ScrollView
import androidx.viewbinding.ViewBinding
import com.intuit.playerui.android.R

/**
 * This class is currently NOT automatically generated by the databinding/viewbinding,
 * That means any changes to the underlying layout file will nto automatically update the available API
 */
public class PlayerBinding private constructor(
    private val rootView: ScrollView,
    public val playerCanvas: FrameLayout,
    public val scrollContainer: ScrollView,
) : ViewBinding {
    override fun getRoot(): ScrollView {
        return rootView
    }

    public companion object {
        @JvmOverloads
        public fun inflate(
            inflater: LayoutInflater,
            parent: ViewGroup? = null,
            attachToParent: Boolean = false,
        ): PlayerBinding {
            val root = inflater.inflate(R.layout.player_fragment, parent, false)
            if (attachToParent) {
                parent!!.addView(root)
            }
            return bind(root)
        }

        public fun bind(rootView: View): PlayerBinding {
            val id = R.id.player_canvas
            val playerCanvas = rootView.findViewById<FrameLayout>(id)
            val scrollContainer = rootView.findViewById<ScrollView>(R.id.scroll_container)

            return PlayerBinding(rootView as ScrollView, playerCanvas, scrollContainer)
        }
    }
}