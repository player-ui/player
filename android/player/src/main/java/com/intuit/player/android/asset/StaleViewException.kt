package com.intuit.player.android.asset

import com.intuit.player.android.AssetContext
import com.intuit.player.jvm.core.player.PlayerException

internal class StaleViewException constructor(val assetContext: AssetContext) : PlayerException("asset[${assetContext.id}] is stale")
