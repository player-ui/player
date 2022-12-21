package com.intuit.player.plugins.devtools

import com.facebook.flipper.android.AndroidFlipperClient
import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.AndroidPlayerPlugin
import com.intuit.player.jvm.core.player.state.CompletedState
import com.intuit.player.jvm.core.plugins.JSPluginWrapper
import com.intuit.player.jvm.core.plugins.PlayerPluginException
import kotlinx.serialization.json.JsonObject

private var count = 0

public class AndroidDevtoolsPlugin private constructor(public var playerID: String, private val devtoolsPlugin: DevtoolsPlugin) : AndroidPlayerPlugin, JSPluginWrapper by devtoolsPlugin {

    private val flipperPlugin = (AndroidFlipperClient
        .getInstanceIfInitialized() ?: throw PlayerPluginException(this::class.java.simpleName, "AndroidFlipperClient not initialized. Ensure your app is initializing the AndroidFlipperClient before this plugin is instantiated.\nhttps://fbflipper.com/docs/getting-started/android-native/"))
        .getPluginByClass(DevtoolsFlipperPlugin::class.java) ?: throw PlayerPluginException(this::class.java.simpleName, "${DevtoolsFlipperPlugin::class.java.simpleName} not found. Ensure the AndroidFlipperClient is registering the ${DevtoolsFlipperPlugin::class.java.simpleName} plugin.")

    public constructor(playerID: String = "player-${count++}") : this(playerID, DevtoolsPlugin(playerID))

    init {
        // TODO: Evaluate if this would work? Does this work for multiple Players? I think so
//        AndroidFlipperClient.getInstanceIfInitialized()?.addPlugin(this)

        flipperPlugin.supportedMethods = devtoolsPlugin.supportedMethods

        devtoolsPlugin.onEvent = DevtoolsEventPublisher {
            flipperPlugin.publishAndroidMessage(it)
        }
    }

    public val supportedMethods: Set<String> by devtoolsPlugin::supportedMethods

    public fun onMethod(method: Method): JsonObject {
        // TODO: Listen for JVM/Android specific events
        return devtoolsPlugin.onMethod(method)
    }

    override fun apply(androidPlayer: AndroidPlayer) {
        flipperPlugin.addPlayer(this)

//        flipperPlugin.publishAndroidMessage(
//            PlayerInitEvent(
//                playerID,
//                BuildConfig.VERSION,
//            )
//        )

        androidPlayer.hooks.state.tap { state ->
            // TODO: Should probably be on ReleasedState?
            if (state is CompletedState) {
                flipperPlugin.removePlayer(this)
            }
        }
    }
}