package com.intuit.playerui.a2ui

import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.a2ui.A2UIPlugin
import com.intuit.playerui.core.plugins.Plugin

/**
 * Builds an [AndroidPlayer] preconfigured for A2UI content — the [A2UIPlugin] (Compose
 * renderers + content adapter + asset transforms + expression functions). Start an A2UI
 * snapshot with `start(snapshot, "a2ui")`.
 *
 * Any additional [plugins] are appended after the A2UI defaults (mirrors `A2UIReactPlayer`).
 *
 * @example
 * ```kotlin
 * val player = A2UIAndroidPlayer()
 * player.start(snapshot, "a2ui")
 * ```
 */
@JvmOverloads
@Suppress("ktlint:standard:function-naming")
public fun A2UIAndroidPlayer(vararg plugins: Plugin, config: AndroidPlayer.Config = AndroidPlayer.Config()): AndroidPlayer = AndroidPlayer(
    A2UIPlugin(),
    *plugins,
    config = config,
)
