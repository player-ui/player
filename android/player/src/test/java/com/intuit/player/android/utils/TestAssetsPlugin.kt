package com.intuit.player.android.utils

import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.AndroidPlayerPlugin
import com.intuit.player.android.METADATA
import com.intuit.player.android.TYPE

internal object TestAssetsPlugin : AndroidPlayerPlugin {
    override fun apply(androidPlayer: AndroidPlayer) {
        androidPlayer.registerAsset("simple", ::SimpleAsset)
        androidPlayer.registerAsset(
            mapOf(
                TYPE to "simple",
                METADATA to mapOf("role" to "other")
            ),
            ::OtherSimpleAsset
        )
    }
}
