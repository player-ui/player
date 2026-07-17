package com.intuit.playerui.android.a2ui

import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayerPlugin
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.JSPluginWrapper
import com.intuit.playerui.core.plugins.findPlugin
import com.intuit.playerui.plugins.a2ui.A2UIPlugin as Transforms

/**
 * Android (Jetpack Compose) renderers for the A2UI v0.9.1 component catalog.
 *
 * Delegates [JSPluginWrapper] to the generated [Transforms] wrapper, which loads the
 * `A2UIPlugin` JS bundle (content adapter + asset transforms + expression functions),
 * and registers the matching Compose assets onto the [AndroidPlayer].
 *
 * Start A2UI content with `player.start(snapshot, "a2ui")`.
 */
public class A2UIPlugin :
    AndroidPlayerPlugin,
    JSPluginWrapper by Transforms() {
    /** register the A2UI assets — type strings are PascalCase to match the adapter output */
    override fun apply(androidPlayer: AndroidPlayer) {
        androidPlayer.registerAsset("Row", ::Row)
        androidPlayer.registerAsset("Column", ::Column)
        androidPlayer.registerAsset("List", ::A2UIList)
        androidPlayer.registerAsset("Text", ::Text)
        androidPlayer.registerAsset("Image", ::Image)
        androidPlayer.registerAsset("Icon", ::Icon)
        androidPlayer.registerAsset("Divider", ::Divider)
        androidPlayer.registerAsset("Button", ::Button)
        androidPlayer.registerAsset("TextField", ::TextField)
        androidPlayer.registerAsset("CheckBox", ::CheckBox)
        androidPlayer.registerAsset("Slider", ::Slider)
        androidPlayer.registerAsset("DateTimeInput", ::DateTimeInput)
        androidPlayer.registerAsset("ChoicePicker", ::ChoicePicker)
        androidPlayer.registerAsset("Card", ::Card)
        androidPlayer.registerAsset("Modal", ::Modal)
        androidPlayer.registerAsset("Tabs", ::Tabs)
    }

    public companion object {
        public val Player.a2uiPlugin: A2UIPlugin get() = findPlugin()!!
    }
}
