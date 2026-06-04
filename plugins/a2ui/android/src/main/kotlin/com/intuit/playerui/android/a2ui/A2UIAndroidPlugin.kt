package com.intuit.playerui.android.a2ui

import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayerPlugin
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.JSPluginWrapper
import com.intuit.playerui.core.plugins.findPlugin
import com.intuit.playerui.plugins.a2ui.A2UIPlugin

/**
 * Registers Jetpack Compose renderers for the A2UI v0.9 reference assets and
 * loads the platform-agnostic A2UI core bundle (which taps `transformContent`
 * and registers the asset transforms + expression functions) by delegating to
 * the generated JVM [A2UIPlugin] wrapper.
 *
 * Hosts opt into A2UI content by starting with an A2UI [StartOptions]:
 * ```
 * androidPlayer.start(snapshotJson, StartOptions(format = "a2ui"))
 * ```
 */
@OptIn(ExperimentalPlayerApi::class)
public class A2UIAndroidPlugin :
    AndroidPlayerPlugin,
    JSPluginWrapper by A2UIPlugin() {
    override fun apply(androidPlayer: AndroidPlayer) {
        // Asset type names are the verbatim A2UI component identifiers so that
        // snapshots adapted via adaptA2UIToFlow resolve directly.
        androidPlayer.registerAsset("Row", ::A2UIRow)
        androidPlayer.registerAsset("Column", ::A2UIColumn)
        androidPlayer.registerAsset("List", ::A2UIList)
        androidPlayer.registerAsset("Text", ::A2UIText)
        androidPlayer.registerAsset("Image", ::A2UIImage)
        androidPlayer.registerAsset("Icon", ::A2UIIcon)
        androidPlayer.registerAsset("Divider", ::A2UIDivider)
        androidPlayer.registerAsset("Button", ::A2UIButton)
        androidPlayer.registerAsset("TextField", ::A2UITextField)
        androidPlayer.registerAsset("CheckBox", ::A2UICheckBox)
        androidPlayer.registerAsset("Slider", ::A2UISlider)
        androidPlayer.registerAsset("DateTimeInput", ::A2UIDateTimeInput)
        androidPlayer.registerAsset("ChoicePicker", ::A2UIChoicePicker)
        androidPlayer.registerAsset("Card", ::A2UICard)
        androidPlayer.registerAsset("Modal", ::A2UIModal)
        androidPlayer.registerAsset("Tabs", ::A2UITabs)
    }

    public companion object {
        public val Player.a2uiAndroidPlugin: A2UIAndroidPlugin get() = findPlugin()!!
    }
}
