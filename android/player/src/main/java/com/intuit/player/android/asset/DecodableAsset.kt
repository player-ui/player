package com.intuit.player.android.asset

import com.intuit.player.android.AssetContext
import com.intuit.player.jvm.core.player.PlayerException
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException

/** Extension of [RenderableAsset] that provides data decoding through the [serializer] */
@Suppress("DEPRECATION_ERROR")
public abstract class DecodableAsset<Data>(assetContext: AssetContext, private val serializer: KSerializer<Data>) : RenderableAsset(assetContext) {

    /** Instance of [Data] is passed to [hydrate] */
    public val data: Data by lazy {
        try {
            asset.deserialize(serializer)
        } catch (exception: SerializationException) {
            assetContext.player.logger.error("Could not deserialize data for $asset", exception)
            throw PlayerException("Could not deserialize data for $asset", exception)
        }
    }
}
