package com.intuit.playerui.android.asset

import android.view.View
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayerPlugin
import com.intuit.playerui.android.AssetContext
import kotlinx.serialization.KSerializer

/** Extension of [DecodableAsset] that provides suspendable [initView] and [hydrate] APIs that will provide an instance of [Data] to use during [View] updates */
@Deprecated("Use DecodableAsset instead", ReplaceWith("DecodableAsset(assetContext, serializer)"))
@Suppress("DEPRECATION_ERROR")
public abstract class SuspendableAsset<Data>(assetContext: AssetContext, serializer: KSerializer<Data>) : DecodableAsset<Data>(assetContext, serializer) {
    @Deprecated(
        "SuspendableAsset.AsyncHydrationTrackerPlugin is deprecated, use DecodableAsset.AsyncHydrationTrackerPlugin instead",
        ReplaceWith("DecodableAsset.AsyncHydrationTrackerPlugin"),
        DeprecationLevel.WARNING,
    )
    public class AsyncHydrationTrackerPlugin : AndroidPlayerPlugin {
        private val delegate = DecodableAsset.AsyncHydrationTrackerPlugin()

        override fun apply(player: AndroidPlayer) {
            delegate.apply(player)
        }
    }
}
