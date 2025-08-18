package com.intuit.playerui.android.asset

import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.core.player.PlayerException

internal class StaleViewException constructor(val assetContext: AssetContext) : PlayerException("asset[${assetContext.id}] is stale")
