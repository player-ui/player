package com.intuit.playerui.android.reference.demo.ui.player

import com.intuit.playerui.android.reference.demo.ui.base.BasePlayerFragment

class DemoPlayerFragment : BasePlayerFragment() {
    override val flow: String get() = arguments?.getString("flow")!!
    override val format: String? get() = arguments?.getString("format")
}
