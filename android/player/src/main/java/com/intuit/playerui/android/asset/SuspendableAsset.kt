package com.intuit.playerui.android.asset

import android.view.View
import com.intuit.playerui.android.AssetContext
import kotlinx.serialization.KSerializer

/** Extension of [DecodableAsset] that provides suspendable [initView] and [hydrate] APIs that will provide an instance of [Data] to use during [View] updates */
@Deprecated("Use DecodableAsset instead", ReplaceWith("DecodableAsset(assetContext, serializer)"), DeprecationLevel.ERROR)
@Suppress("DEPRECATION_ERROR")
public abstract class SuspendableAsset<Data>(assetContext: AssetContext, serializer: KSerializer<Data>) : DecodableAsset<Data>(assetContext, serializer)
