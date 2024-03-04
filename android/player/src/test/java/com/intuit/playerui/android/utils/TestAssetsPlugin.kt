package com.intuit.playerui.android.utils

import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayerPlugin
import com.intuit.playerui.android.METADATA
import com.intuit.playerui.android.TYPE

object TestAssetsPlugin : AndroidPlayerPlugin {
    override fun apply(androidPlayer: AndroidPlayer) {
        androidPlayer.registerAsset("simple", ::SimpleAsset)
        androidPlayer.registerAsset(
            mapOf(
                TYPE to "simple",
                METADATA to mapOf("role" to "other"),
            ),
            ::OtherSimpleAsset,
        )
        androidPlayer.registerAsset("broken", ::BrokenAsset)
    }
}
