package com.intuit.playerui.android.asset

import com.intuit.playerui.android.AssetContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.nullable

/** Non-generic sealed interface used as the field type for nested assets in [kotlinx.serialization.Serializable] data classes. */
@Serializable(with = GenericAsset.ContextualSerializer::class)
public sealed interface GenericAsset {
    public val assetContext: AssetContext

    public object ContextualSerializer : KSerializer<GenericAsset> by kotlinx.serialization.ContextualSerializer(GenericAsset::class)

    public object AssetListSerializer : KSerializer<List<GenericAsset>> by ListSerializer(ContextualSerializer)

    public object NullableAssetListSerializer : KSerializer<List<GenericAsset?>> by ListSerializer(ContextualSerializer.nullable)
}
