package com.intuit.player.android.reference.assets

import android.content.Context
import android.content.Intent
import android.content.Intent.FLAG_ACTIVITY_NEW_TASK
import android.net.Uri
import androidx.core.content.ContextCompat.startActivity
import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.AndroidPlayerPlugin
import com.intuit.player.android.reference.assets.action.Action
import com.intuit.player.android.reference.assets.collection.Collection
import com.intuit.player.android.reference.assets.info.Info
import com.intuit.player.android.reference.assets.input.Input
import com.intuit.player.android.reference.assets.text.Text
import com.intuit.player.jvm.core.player.Player
import com.intuit.player.jvm.core.plugins.JSPluginWrapper
import com.intuit.player.jvm.core.plugins.findPlugin
import com.intuit.player.plugins.assets.ReferenceAssetsPlugin as Transforms

/**
 * The [ReferenceAssetsPlugin] is a set of reference assets for use with the Android player.
 * They serve as both a code sample and an easy way to get started using the Android player.
 */
class ReferenceAssetsPlugin : AndroidPlayerPlugin, JSPluginWrapper by Transforms() {

    private lateinit var player: AndroidPlayer

    /** register core assets */
    override fun apply(androidPlayer: AndroidPlayer) {
        player = androidPlayer
        androidPlayer.registerAsset("action", ::Action)
        androidPlayer.registerAsset("text", ::Text)
        androidPlayer.registerAsset("collection", ::Collection)
        androidPlayer.registerAsset("info", ::Info)
        androidPlayer.registerAsset("input", ::Input)
    }

    fun handleLink(ref: String, context: Context) = startActivity(
        context,
        Intent(Intent.ACTION_VIEW, Uri.parse(ref)).apply {
            flags += FLAG_ACTIVITY_NEW_TASK
        },
        null,
    )

    companion object {
        val Player.referenceAssetsPlugin: ReferenceAssetsPlugin get() = findPlugin()!!
    }
}
