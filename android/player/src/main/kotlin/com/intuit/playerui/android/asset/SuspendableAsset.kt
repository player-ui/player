package com.intuit.playerui.android.asset

import com.intuit.playerui.android.AssetContext
import kotlinx.serialization.KSerializer

@Deprecated(
    "Use RenderableAsset<Data> directly",
    ReplaceWith("RenderableAsset<Data>(assetContext, serializer)"),
    DeprecationLevel.WARNING,
)
public abstract class SuspendableAsset<Data>(
    assetContext: AssetContext,
    serializer: KSerializer<Data>,
) : RenderableAsset<Data>(assetContext, serializer)
