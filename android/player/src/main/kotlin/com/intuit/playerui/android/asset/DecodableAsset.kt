package com.intuit.playerui.android.asset

import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.core.player.PlayerException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException

/** Extension of [RenderableAsset] that provides data decoding through the [serializer] */
@Suppress("DEPRECATION_ERROR")
public abstract class DecodableAsset<Data>(
    assetContext: AssetContext,
    private val serializer: KSerializer<Data>,
) : RenderableAsset(assetContext) {
    /** Suspendable way to deserialize an instance of [Data] */
    public suspend fun getData(): Data = withContext(Dispatchers.Default) {
        data
    }

    @Deprecated(
        "Direct access to this property encourages blocking runtime access, use suspendable getData instead to ensure threads aren't blocked on data decoding.",
        ReplaceWith("getData()"),
    )
    /** Instance of [Data] is passed to [hydrate] */
    public open val data: Data by lazy {
        try {
            asset.deserialize(serializer)
        } catch (exception: SerializationException) {
            assetContext.player.logger.error("Could not deserialize data for $asset", exception)
            throw PlayerException("Could not deserialize data for $asset", exception)
        }
    }
}
