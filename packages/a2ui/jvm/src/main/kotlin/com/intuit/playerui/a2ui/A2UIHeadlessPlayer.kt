package com.intuit.playerui.a2ui

import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.HeadlessPlayer
import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeConfig
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.plugins.a2ui.A2UIPlugin

/**
 * Builds a [HeadlessPlayer] preconfigured for A2UI content — the A2UIPlugin (content
 * adapter, asset transforms, expression functions) plus [CommonTypesPlugin] for typed
 * data/validation. Start an A2UI snapshot with `start(snapshot, "a2ui")`.
 *
 * Any additional [plugins] are appended after the A2UI defaults, so consumer taps run
 * later and win on conflict (mirrors `A2UIReactPlayer`).
 *
 * @example
 * ```kotlin
 * val player = A2UIHeadlessPlayer()
 * player.start(snapshot, "a2ui").await()
 * ```
 */
@OptIn(ExperimentalPlayerApi::class)
@JvmOverloads
public fun A2UIHeadlessPlayer(
    vararg plugins: Plugin,
    config: PlayerRuntimeConfig = PlayerRuntimeConfig(),
    explicitRuntime: Runtime<*>? = null,
): HeadlessPlayer = HeadlessPlayer(
    A2UIPlugin(),
    *plugins,
    config = config,
    explicitRuntime = explicitRuntime,
)
