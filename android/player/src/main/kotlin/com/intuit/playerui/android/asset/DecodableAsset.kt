package com.intuit.playerui.android.asset

import com.intuit.playerui.android.AssetContext
import kotlinx.serialization.KSerializer

/**
 * Deprecated — use [RenderableAsset] directly.
 *
 * This class previously held data-decoding logic that has been merged into [RenderableAsset].
 * It is kept as a thin subclass for binary compatibility and will be removed in a future version.
 */
@Deprecated(
    "Use RenderableAsset<Data> directly",
    ReplaceWith("RenderableAsset<Data>(assetContext, serializer)"),
    DeprecationLevel.WARNING,
)
public abstract class DecodableAsset<Data>(
    assetContext: AssetContext,
    serializer: KSerializer<Data>,
) : RenderableAsset<Data>(assetContext, serializer)
